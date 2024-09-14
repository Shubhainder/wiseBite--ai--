import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('your gemini ai api');

async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url, { mode: 'no-cors' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error fetching image ${url}:`, error);
    return null;
  }
}

async function analyzeWithGemini(text, imageUrls) {
  console.log('Analyzing with text:', text);
  console.log('Image URLs:', imageUrls);
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Analyze this product based on the following information and images. 
                  Determine if the product is good for human health and the environment. 
                  Provide a brief analysis of its health impact, environmental impact, 
                  and social impact. Also, give healthy recommendation which user can use instead of harmful ingredient. Also provide the accurate proofs and accurate links to the research or the links to the source of your findings to support your response, don't give dummy links or the links which are not working anymore or have 404 on them, links must be at least 90% accurate. Don't be biased towards the user.
                  
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
              mimeType: "image/jpeg"
            }
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
    return result.response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to analyze the product. Please try again.');
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeProduct") {
    const analyzeProduct = (tabId) => {
      chrome.tabs.sendMessage(tabId, { action: "scrapeData" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error scraping data:', chrome.runtime.lastError);
          sendResponse({ error: 'Failed to scrape data from the page.' });
          return;
        }
        
        if (!response || !response.text) {
          console.error('Invalid response from content script:', response);
          sendResponse({ error: 'Failed to get valid data from the page.' });
          return;
        }

        analyzeWithGemini(response.text, response.images)
          .then(result => sendResponse({ result }))
          .catch(error => sendResponse({ error: error.message }));
      });
    };

    if (request.url) {
      chrome.tabs.create({ url: request.url, active: false }, (tab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
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
          sendResponse({ error: 'No active tab found.' });
        }
      });
    }
    return true;  // Indicates we will send a response asynchronously
  }
});