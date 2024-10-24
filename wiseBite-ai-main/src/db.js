// db.js
import mongoose from 'mongoose';

const uri = "mongodb+srv...your uri";
let dbConnection = null;
let Alternative = null;

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

async function initializeDB() {
  if (!dbConnection) {
    try {
      dbConnection = await mongoose.connect(uri)
      
      // Only create the model if it hasn't been created yet
      if (!Alternative) {
        Alternative = mongoose.model('Alternative', alternativeSchema);
      }
      
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }
  return dbConnection;
}

export async function findNaturalAlternatives(productInfo) {
  try {
    console.log('Searching for alternatives for:', productInfo);
    
    // Ensure database connection and model are initialized
    await initializeDB();
    
    if (!Alternative) {
      throw new Error('Model not initialized');
    }
    if(dbConnection){

      const alternatives = await Alternative.find({ productType: productInfo });
      console.log('Found alternatives:', alternatives);
      return alternatives;
    }
  } catch (error) {
    console.error('Error finding alternatives:', error);
    return [];
  }
}

let altT = await findNaturalAlternatives('Peanut Butter');
console.log(altT); 


export { Alternative, initializeDB };