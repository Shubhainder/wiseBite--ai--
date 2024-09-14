function scrapeData() {
  const ingredientsKeywords = ['ingredients', 'specifications', 'nutrition'];
  let scrapedText = '';
  let images = [];

  function findClosestHeading(element) {
    while (element && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
      element = element.previousElementSibling || element.parentElement;
    }
    return element ? element.textContent : '';
  }

  function scrapeImages(selector, limit = 5) {
    document.querySelectorAll(selector).forEach(img => {
      if (img.src && images.length < limit) {
        images.push(img.src);
      }
    });
  }
  const hostname = window.location.hostname;
  
  
  // amazon
  if (hostname.includes('amazon.in')) {
    const productTitle = document.getElementById('productTitle');
    if (productTitle) {
      scrapedText += `Product Title: ${productTitle.innerText.trim()}\n\n`;
    }

    let ingredientsFound = false;
    document.querySelectorAll('.prodDetSectionEntry').forEach(el => {
      if (el.textContent.toLowerCase().includes('ingredients')) {
        ingredientsFound = true;
        const parent = el.parentElement;
        const sibling = el.nextElementSibling;
        const content = (parent || sibling)?.textContent.trim();
        if (content && content.toLowerCase() !== 'na') {
          scrapedText += `${el.textContent.trim()}:\n${content}\n\n`;
        } else {
          ingredientsFound = false;
        }
      }
    });

    const productDetails = document.getElementById('productDetails');
    if (productDetails) {
      scrapedText += `Product Details:\n${productDetails.innerText}\n\n`;
    }

    const importantInfo = document.getElementById('important-information');
    if (importantInfo && importantInfo.firstElementChild) {
      scrapedText += `Important Information:\n${importantInfo.children[1].innerText}\n\n`;
    }

    if (!ingredientsFound) {
      document.querySelectorAll('#a-autoid-4-announce').forEach(el => {
          const imgElement = el.parentElement.querySelector('img');
          if (imgElement && images.length < 5) {
            images.push(imgElement?.src);
          }
          
        });
      
    }
  } 

  // flipkart
  else if (hostname.includes('flipkart.com')) {
    const title = document.querySelector('.VU-ZEz')?.innerText.trim();
    if (title) {
      scrapedText += `Product Title: ${title}\n\n`;
    }

    const ingredientsElement = document.querySelectorAll('.WJdYP6');
    ingredientsElement.forEach(el=>{

      if (el.innerText.toLowerCase().includes('ingredient')) {
        const content = el.innerText.trim();
        if (content) {
          scrapedText += `Ingredients:\n${content}\n\n`;
        } 
        // else if(content.toLowerCase.includes('na')) {
        //   scrapeImages('._0DkuPH');
        // }
      } 
      else {
        scrapeImages('._0DkuPH');
      }
    })
  } 
  


  // swiggy
  else if (hostname.includes('swiggy.com')) {
    const title = document.querySelector('.hgjRZ')?.innerText.trim();
    if (title) {
      scrapedText += `Product Title: ${title}\n\n`;
    }

    const ingredientsElement = document.querySelector('._2Q05q');
    if (ingredientsElement && ingredientsElement.innerText.toLowerCase().includes('ingredients')) {
      const content = ingredientsElement.innerText.trim();
      if (content.toLowerCase() !== 'na') {
        scrapedText += `Ingredients:\n${content}\n\n`;
      } else {
        scrapeImages('.itLenQ');
      }
    } else {
      scrapeImages('.itLenQ');
    }
  } 
  
  
  // zepto - now  (zeptonow.com)
  else if (hostname.includes('zeptonow.com')) {
    const title = document.querySelector('[data-testid="pdp-product-name"]')?.innerText.trim();
    if (title) {
      scrapedText += `Product Title: ${title}\n\n`;
    }

    const detailsContainer = document.querySelector('[data-testid="product-details-container"]');
    if (detailsContainer) {
      scrapedText += `Product Details:\n${detailsContainer.innerText}\n\n`;
    }

    if (!detailsContainer.innerText.toLowerCase().includes('ingredients')) {
      const imgElementZepto=document.querySelector('#holder')
      imgElementZepto.parentElement.querySelectorAll('img').forEach(el => {
           
        if (el && images.length < 5) {
          images.push(el?.src);
        }
           
         });    }
  } 
  
  
  // blinkit
  else if (hostname.includes('blinkit.com')) {
    const osWindowsElement = document.querySelector('.os-windows');
    if (osWindowsElement) {
      const sixthDiv = osWindowsElement.children[5];
      if (sixthDiv) {
        const firstInnerDiv = sixthDiv.firstElementChild;
        if (firstInnerDiv) {
          for (let i = 1; i < 25 && i < firstInnerDiv.children.length; i++) {
            scrapedText += firstInnerDiv.children[i].innerText + '\n\n';
          }
        }
      }
    }

    if (!scrapedText.toLowerCase().includes('ingredients')) {
      const imgElementBlinkit = document.querySelectorAll('.bjbvTy');
      imgElementBlinkit.forEach(el => {
        if (el && images.length < 5) {
          images.push(el?.src);
        }
        
      })
      // Find the first img tag inside the parent element, even if it's nested deeply
      
      // Get the src attribute of the img tag
      const imgSrc = imgElement ? imgElement.src : null;
      
      // Output the src attribute to the console
      // console.log(imgSrc);
    }
  } 
  
  
  // bigbasket
  else if (hostname.includes('bigbasket.com')) {
    const brand = document.querySelector('.Brand___StyledH-sc-zi64kd-1')?.innerText.trim();
    if (brand) {
      scrapedText += `Brand: ${brand}\n\n`;
    }

    const moreDetails = document.querySelector('.MoreDetails___StyledSection-sc-1h9rbjh-4');
    if (moreDetails) {
      if (moreDetails.innerText.toLowerCase().includes('ingredients')) {
        scrapedText += `More Details:\n${moreDetails.innerText}\n\n`;
      } else {
        // scrapeImages('img');
      }
    } else {
      // scrapeImages('img');
    }
  } 
  
  else {
    // Existing scraping logic for other websites
    document.body.querySelectorAll('*').forEach(el => {
      const text = el.textContent.toLowerCase();
      if (ingredientsKeywords.some(keyword => text.includes(keyword))) {
        const heading = findClosestHeading(el);
        scrapedText += `${heading}:\n${el.textContent}\n\n`;
        
        let sibling = el.nextElementSibling;
        while (sibling && images.length < 5) {
          if (sibling.tagName === 'IMG' && sibling.src) {
            images.push(sibling.src);
          }
          sibling = sibling.nextElementSibling;
        }
      }
    });

    if (!scrapedText) {
      scrapeImages('img');
    }
  }

  // console.log(scrapedText);
  return { text: scrapedText || document.body.innerText.slice(0, 1000), images };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeData") {
    sendResponse(scrapeData());
  }
});