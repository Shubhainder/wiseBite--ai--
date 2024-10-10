
// db.js
import mongoose from 'mongoose';

async function connection(){
await  mongoose.connect(uri);
console.log('connected');

}
connection()

const alternativeSchema = new mongoose.Schema({
  productType: String,
  commonIngredients: [String],
  naturalAlternatives: [{
    name: String,
    description: String,
    healthBenefits: [String],
    whereToBuy: [String]
  }]
});

const Alternative = mongoose.model('Alternative', alternativeSchema);



// Function to initialize database with sample data
async function initializeDB() {
  try {
    await mongoose.connect(uri);
    
    const alternatives = await Alternative.find({productType:'Peanut Butter'})
    console.log(alternatives)
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// initializeDB()
// let productInfo = 'Peanut Butter';

export  async function findNaturalAlternatives(productInfo) {
  // console.log(productInfo,'testing db 1')
  
  try {
    // console.log(productInfo,'testing db 2')
    const query= {productType:productInfo}
    
    const alternatives = await Alternative.find({productType:productInfo})
    // console.log(productInfo,'testing db 3')
    // console.log(alternatives,'fail??')
    return alternatives;
  } catch (error) {
    console.error('Error finding alternatives:', error);
    return [];
  }
}

// let altText = await findNaturalAlternatives(productInfo);
// console.log(altText);


export { Alternative, initializeDB };