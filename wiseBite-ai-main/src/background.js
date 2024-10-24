import { GoogleGenerativeAI } from "@google/generative-ai";
import { findNaturalAlternatives, Alternative, initializeDB } from "./db";

const storedKeywords = [
  "Peanut Butter",
  "Almond Butter",
  "Organic Honey",
  "Gluten-Free Bread",
];

const genAI = new GoogleGenerativeAI("your gemini api key");

async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url, { mode: "no-cors" });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error fetching image ${url}:`, error);
    return null;
  }
}

let productTitle;
let matchKey;

chrome.storage.local.get(["productTitle"], (result) => {
  // console.log(result, result.productTitle );

  productTitle = result.productTitle;

  matchKey = findKeywordMatch(productTitle);
});

function findKeywordMatch(title) {
  if (!title) return null;
  const lowerCaseTitle = title.toLowerCase();
  return storedKeywords.find((keyword) =>
    lowerCaseTitle.includes(keyword.toLowerCase())
  );
}

async function analyzeWithGemini(text, imageUrls, question) {
  // console.log("Analyzing with text:", text);
  // console.log("Image URLs:", imageUrls);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  console.log("question:--",question);

  // console.log(matchKey);

  let alternatives = [];
  if (matchKey) {
    try {
      alternatives = await findNaturalAlternatives(matchKey);
      console.log("Found alternatives:", alternatives);
    } catch (error) {
      console.error("Error finding alternatives:", error);
    }
  }

  let alternativesText =
    alternatives.length > 0
      ? `Natural alternatives found in our database:\n${alternatives
          .map(
            (alt) =>
              `${alt.productType}:\n${alt.naturalAlternatives
                .map(
                  (na) =>
                    `- ${na.name}: ${
                      na.description
                    }\n  Benefits: ${na.healthBenefits.join(", ")}`
                )
                .join("\n")}`
          )
          .join("\n\n")}`
      : "";

  const prompt = `Analyze this product based on the following information and images. 
                  Determine if the product is good for human health and the environment. 
                  Provide a brief analysis of its health impact, environmental impact, 
                  and social impact. Also, give healthy recommendation which user can use instead of harmful ingredient. Also provide the accurate proofs and accurate links to the research or the links to the source of your findings to support your response, don't give dummy links or the links which are not working anymore or have 404 on them, links must be at least 90% accurate. Don't be biased towards the user. after the title mention the one liner whether the product is safe or not adn then mention the rest. provide natural alternatives at the end and provide accurate links to the if possible only from websites: amazon.in, flipkart.com, blinkit.com, zepto,bigbasket. if you do not have correct link for alternate product then do not provide any link. Do not hallucinate.
                  ${
                    question
                      ? `\n\nSpecific question from user: ${question}`
                      : ""
                  } 
                  Product Information:
                  ${text}`;

  const imageObjects = await Promise.all(
    (imageUrls || []).slice(0, 2).map(async (imageUrl) => {
      try {
        const base64Image = await fetchImageAsBase64(imageUrl);
        if (base64Image) {
          return {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg",
            },
          };
        }
      } catch (error) {
        console.error(`Error processing image ${imageUrl}:`, error);
      }
      return null;
    })
  );

  const validImageObjects = imageObjects.filter(Boolean);

  try {
    const result = await model.generateContent([prompt, ...validImageObjects]);
    const analysisText = result.response.text();
    const finalAnalysis = `${analysisText}\n\nNatural Alternatives:\n${alternativesText}`;

    return finalAnalysis;
    // return result.response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to analyze the product. Please try again.");
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeImage") {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageObject = {
      inlineData: {
        data: request.image,
        mimeType: "image/jpeg",
      },
    };

    const prompt = `Analyze this product image showing ingredients. 
                    Determine if the product is good for human health and the environment. 
                    Provide a brief analysis of its health impact, environmental impact, 
                    and social impact. Also, give healthy recommendations which users can use instead of harmful ingredients. Also provide natural alternatives. give a nudge at the top whether the product is safe to consume or not followed by the pros and cons of it.
                    ${
                      request.question
                        ? `\n\nSpecific question from user: ${request.question}`
                        : ""
                    }`;

    model
      .generateContent([prompt, imageObject])
      .then((result) => sendResponse({ result: result.response.text() }))
      .catch((error) => sendResponse({ error: error.message }));

    return true; // Indicates we will send a response asynchronously
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeProduct") {
    const analyzeProduct = (tabId) => {
      chrome.tabs.sendMessage(tabId, { action: "scrapeData" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error scraping data:", chrome.runtime.lastError);
          sendResponse({ error: "Failed to scrape data from the page." });
          return;
        }

        if (!response || !response.text) {
          console.error("Invalid response from content script:", response);
          sendResponse({ error: "Failed to get valid data from the page." });
          return;
        }

        analyzeWithGemini(response.text, response.images, request.question)
          .then((result) => sendResponse({ result }))
          .catch((error) => sendResponse({ error: error.message }));
      });
    };

    if (request.url) {
      chrome.tabs.create({ url: request.url, active: false }, (tab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            analyzeProduct(tab.id);
            chrome.tabs.remove(tab.id);
          }
        });
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          analyzeProduct(tabs[0].id);
        } else {
          sendResponse({ error: "No active tab found." });
        }
      });
    }
    return true; // Indicates we will send a response asynchronously
  }
});
