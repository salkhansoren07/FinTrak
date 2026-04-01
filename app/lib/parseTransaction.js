function decodeBase64(data) {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + (4 - (base64.length % 4)) % 4,
    "="
  );
  if (typeof atob === "function") {
    return atob(padded);
  }
  return Buffer.from(padded, "base64").toString("utf8");
}

function normalizeText(text) {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBody(payload) {
  if (payload.body?.data) {
    return {
      data: payload.body.data,
      mimeType: payload.mimeType || "",
    };
  }

  if (payload.parts) {
    for (const preferredType of ["text/plain", "text/html", ""]) {
      for (const part of payload.parts) {
        const data = extractBody(part);
        if (!data) continue;
        if (!preferredType || data.mimeType === preferredType) {
          return data;
        }
      }
    }
  }
  return null;
}

function extractSenderAddress(from) {
  const match = from.match(/<([^>]+)>/);
  const email = match?.[1] || from;
  return email.trim().toLowerCase();
}

function extractAmount(text) {
  const patterns = [
    /(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:INR|Rs\.?|₹)/i,
    /amount(?:\s+of)?\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return Number(match[1].replace(/,/g, ""));
    }
  }

  return 0;
}

function detectType(text) {
  if (/(debited|spent|paid|sent|withdrawn|purchase|dr\b|transferred to)/i.test(text)) {
    return "Debit";
  }

  if (/(credited|received|deposited|refund|reversed|cr\b|transferred from)/i.test(text)) {
    return "Credit";
  }

  return "Unknown";
}

function hasTransactionSignal(text) {
  return /(debited|credited|spent|received|paid|payment|upi|withdrawn|deposited|deposit|refund|reversed|txn|transaction|transferred)/i.test(
    text
  );
}

function hasBankSignal(text) {
  return /(account|a\/c|ac(?:count)?|bank|upi|card|wallet|merchant|vpa|utr|ref(?:erence)?\s*no|txn\s*id|available\s*bal)/i.test(
    text
  );
}

function hasTrustedSender(senderAddress) {
  return /(?:bank|hdfc|icici|axis|kotak|sbi|pnb|upi|paytm|phonepe|gpay|googlepay|amazonpay|billdesk|razorpay)/i.test(
    senderAddress
  );
}

function extractVpa(text) {
  const contextualPatterns = [
    /(?:VPA|UPI ID|Payee|beneficiary|merchant|to|towards)\s*[:\-]?\s*([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/i,
  ];

  for (const pattern of contextualPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "N/A";
}

export function parseTransaction(email) {
  if (!email?.payload) return null;

  // 1. Extract Headers to check 'From' or 'Subject' for Bank Name
  const headers = email.payload.headers || [];
  const subject = headers.find(h => h.name === 'Subject')?.value || "";
  const from = headers.find(h => h.name === 'From')?.value || "";
  const senderAddress = extractSenderAddress(from);
  
  const body = extractBody(email.payload);

  let decoded = "";
  if (body?.data) {
    try {
      decoded = normalizeText(decodeBase64(body.data));
    } catch {
      decoded = "";
    }
  }
  
  // Combine all text sources to search for the bank
  const fullContext = normalizeText(`${subject} ${from} ${decoded}`);

  const amount = extractAmount(fullContext);
  const type = detectType(fullContext);
  const vpa = extractVpa(fullContext);

  // 2. Enhanced Bank Detection
  const bankPatterns = [
    { name: "HDFC", regex: /HDFC/i },
    { name: "SBI", regex: /SBI|State Bank/i },
    { name: "ICICI", regex: /ICICI/i },
    { name: "Axis", regex: /Axis/i },
    { name: "Kotak", regex: /Kotak/i },
    { name: "PNB", regex: /PNB|Punjab National/i },
  ];

  // We search the 'fullContext' (Subject + From + Body)
  const foundBank = bankPatterns.find((b) => b.regex.test(fullContext));
  const bank = foundBank ? foundBank.name : "Other";
// 3. Category Detection (rule based)

  let category = "Other";

  const categoryRules = [
    { name: "Food", regex: /zomato|swiggy|restaurant|food|domino|pizza/i },
    { name: "Shopping", regex: /amazon|flipkart|myntra|meesho|ajio/i },
    { name: "Transfer", regex: /upi|paytm|phonepe|gpay|transfer/i },
    { name: "Bills", regex: /electricity|recharge|broadband|gas|bill/i },
  ];

  const foundCategory = categoryRules.find(c =>
    c.regex.test(fullContext)
  );

  if (foundCategory) category = foundCategory.name;

  const timestamp = Number(email.internalDate);
  const dateObj = new Date(timestamp);

  if (
    !amount ||
    type === "Unknown" ||
    !hasTransactionSignal(fullContext) ||
    (!hasBankSignal(fullContext) && !hasTrustedSender(senderAddress)) ||
    (bank === "Other" && vpa === "N/A")
  ) {
    return null;
  }

  return {
    id: email.id,
    amount,
    type,
    bank,
    vpa,
    category,
    timestamp,
    dateLabel: dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
  };
}
