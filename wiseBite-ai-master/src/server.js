import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';


const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const genAI = new GoogleGenerativeAI('your gemini api');

function scrapeData(html, hostname) {
  const $ = cheerio.load(html);
  let scrapedText = '';
  let images = [];

  function scrapeImages(selector, limit = 5) {
    $(selector).each((i, el) => {
      if (images.length < limit) {
        const src = $(el).attr('src');
        if (src) images.push(src);
      }
    });
  }

  if (hostname.includes('amazon.in')) {
    scrapedText += `Product Title: ${$('#productTitle').text().trim()}\n\n`;

    $('.prodDetSectionEntry').each((i, el) => {
      if ($(el).text().toLowerCase().includes('ingredients')) {
        const content = $(el).parent().text().trim() || $(el).next().text().trim();
        if (content && content.toLowerCase() !== 'na') {
          scrapedText += `${$(el).text().trim()}:\n${content}\n\n`;
        }
      }
    });

    scrapedText += `Product Details:\n${$('#productDetails').text()}\n\n`;
    
    const importantInfo = $('#important-information').children().first();
    if (importantInfo.length) {
      scrapedText += `Important Information:\n${importantInfo.text()}\n\n`;
    }

    if (!scrapedText.toLowerCase().includes('ingredients')) {
      scrapeImages('#ppd img');
    }
  } else if (hostname.includes('flipkart.com')) {
    scrapedText += `Product Title: ${$('.VU-ZEz').text().trim()}\n\n`;

    const ingredientsElement = $('.WJdYP6').filter((i, el) => $(el).text().toLowerCase().includes('ingredients'));
    if (ingredientsElement.length) {
      const content = ingredientsElement.text().trim();
      const sibling = ingredientsElement.next();
      if (content.toLowerCase() !== 'na' && (!sibling.length || sibling.text().trim().toLowerCase() !== 'na')) {
        scrapedText += `Ingredients:\n${content}\n\n`;
      } else {
        scrapeImages('._0DkuPH img');
      }
    } else {
      scrapeImages('._0DkuPH img');
    }
  } else if (hostname.includes('swiggy.com')) {
    scrapedText += `Product Title: ${$('.hgjRZ').text().trim()}\n\n`;

    const ingredientsElement = $('._2Q05q').filter((i, el) => $(el).text().toLowerCase().includes('ingredients'));
    if (ingredientsElement.length) {
      const content = ingredientsElement.text().trim();
      if (content.toLowerCase() !== 'na') {
        scrapedText += `Ingredients:\n${content}\n\n`;
      } else {
        scrapeImages('.itLenQ img');
      }
    } else {
      scrapeImages('.itLenQ img');
    }
  } else if (hostname.includes('zeptonow.com')) {
    scrapedText += `Product Title: ${$('[data-testid="pdp-product-name"]').text().trim()}\n\n`;

    const detailsContainer = $('[data-testid="product-details-container"]');
    if (detailsContainer.length) {
      scrapedText += `Product Details:\n${detailsContainer.text()}\n\n`;
    }

    if (!detailsContainer.length || !detailsContainer.text().toLowerCase().includes('ingredients')) {
      scrapeImages('#holder img');
    }
  } else if (hostname.includes('blinkit.com')) {
    const osWindowsElement = $('.os-windows');
    if (osWindowsElement.length) {
      const sixthDiv = osWindowsElement.children().eq(5);
      if (sixthDiv.length) {
        const firstInnerDiv = sixthDiv.children().first();
        if (firstInnerDiv.length) {
          firstInnerDiv.children().slice(1, 25).each((i, el) => {
            scrapedText += $(el).text() + '\n\n';
          });
        }
      }
    }

    if (!scrapedText.toLowerCase().includes('ingredients')) {
      scrapeImages('.slick-track img');
    }
  } else if (hostname.includes('bigbasket.com')) {
    scrapedText += `Brand: ${$('.Brand___StyledH-sc-zi64kd-1').text().trim()}\n\n`;

    const moreDetails = $('.MoreDetails___StyledSection-sc-1h9rbjh-4');
    if (moreDetails.length) {
      if (moreDetails.text().toLowerCase().includes('ingredients')) {
        scrapedText += `More Details:\n${moreDetails.text()}\n\n`;
      } else {
        scrapeImages('img');
      }
    } else {
      scrapeImages('img');
    }
  }

  return { text: scrapedText || $('body').text().slice(0, 1000), images };
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    const response = await axios.get(url);
    const { text, images } = scrapeData(response.data, new URL(url).hostname);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this product based on the following information and images. 
                  Determine if the product is good for human health and the environment. 
                  Provide a brief analysis of its health impact, environmental impact, 
                  and social impact. Also, give healthy recommendation which user can use instead of harmful ingredient. Also provide the accurate proofs and accurate links to the research or the links to the source of your findings to support your response, don't give dummy links or the links which are not working anymore or have 404 on them, links must be at least 90% accurate. Don't be biased towards the user.

${text}

Please provide a summary of the product's impact in these areas, along with any recommendations for consumers.`;

    const imageObjects = await Promise.all(images.map(async (imageUrl) => {
      try {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return {
          inlineData: {
            data: Buffer.from(imageResponse.data).toString('base64'),
            mimeType: imageResponse.headers['content-type']
          }
        };
      } catch (error) {
        console.error(`Error processing image ${imageUrl}:`, error);
        return null;
      }
    }));

    const validImageObjects = imageObjects.filter(Boolean);

    const result = await model.generateContent([prompt, ...validImageObjects]);
    const analysis = result.response.text();

    res.json({ text, images, analysis });
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).json({ error: 'Failed to analyze product' });
  }
});

const PORT = process.env.PORT || 3000 || 5173;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});