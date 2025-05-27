const express = require('express');
const app = express()
const cors = require("cors");
const pool = require("./db")

app.use(cors());
app.use(express.json())

// Create the cards table first
const createCardsTable = `CREATE TABLE IF NOT EXISTS cards(
  card_id SERIAL PRIMARY KEY,
  card_name VARCHAR(255) NOT NULL,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_default BOOLEAN DEFAULT false
)`

// Create the social_media table second (referenced table)
const createSocialMediaTable = `CREATE TABLE IF NOT EXISTS social_media(
  social_media_id SERIAL PRIMARY KEY,
  linkedin VARCHAR(255),
  twitter VARCHAR(255),
  instagram VARCHAR(255),
  github VARCHAR(255),
  facebook VARCHAR(255)
)`

// Create a card table third (main table)
const createCardTable = `CREATE TABLE IF NOT EXISTS card(
  card_id INTEGER REFERENCES cards(card_id), -- Reference to the parent card
  card_name VARCHAR(255) NOT NULL,
  card_type VARCHAR(50) DEFAULT 'profile', -- Default type is 'profile'
  date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Fields for the card profile
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  additional_name VARCHAR(255),
  headline VARCHAR(255) NOT NULL,
  bio VARCHAR(255),
  social_media_id INTEGER REFERENCES social_media(social_media_id),
  meeting_link VARCHAR(255),
  personal_website VARCHAR(255),
  additional_urls VARCHAR(255)
)`

// Create tables when server starts
const initDatabase = async () => {
  try {
    // Create tables in the correct order
    await pool.query(createCardsTable);
    await pool.query(createSocialMediaTable);
    await pool.query(createCardTable);
    console.log("Database tables created successfully");
  } catch (err) {
    console.error("Error creating database tables:", err);
  }
}

// Initialize database
initDatabase();

// Routes
// Create a new card with social media links
app.post("/cards", async (req, res) => {
  try {
    // Begin transaction
    await pool.query("BEGIN");
    
    // Extract data from request body
    const { 
      card_name,
      first_name, 
      last_name, 
      additional_name, 
      headline, 
      bio, 
      meeting_link, 
      personal_website,
      additional_urls,
      social_media 
    } = req.body;
    
    // 1. Create card entry (parent record in cards table)
    const cardResult = await pool.query(
      "INSERT INTO cards (card_name, is_default) VALUES ($1, $2) RETURNING card_id, card_name",
      [card_name, false]  // Default to false for is_default
    );
    
    const cardId = cardResult.rows[0].card_id;
    // Ensure we use the same card_name from the cards table (in case of any normalization/trimming in DB)
    const savedCardName = cardResult.rows[0].card_name;
    
    // 2. Create social media entry 
    const socialMediaResult = await pool.query(
      "INSERT INTO social_media (linkedin, twitter, instagram, github, facebook) VALUES ($1, $2, $3, $4, $5) RETURNING social_media_id",
      [social_media.linkedin, social_media.twitter, social_media.instagram, social_media.github, social_media.facebook]
    );
    
    const socialMediaId = socialMediaResult.rows[0].social_media_id;
    
    // 3. Create card with reference to card and social media
    // Using the same card_name from the parent cards table to ensure consistency
    const cardResult2 = await pool.query(
      "INSERT INTO card (card_id, card_name, first_name, last_name, additional_name, headline, bio, social_media_id, meeting_link, personal_website, additional_urls) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
      [cardId, savedCardName, first_name, last_name, additional_name, headline, bio, socialMediaId, meeting_link, personal_website, additional_urls]
    );
    
    // Commit transaction
    await pool.query("COMMIT");
    
    res.status(201).json({
      status: "success",
      data: {
        card: cardResult2.rows[0],
        social_media: social_media
      }
    });
    
  } catch (err) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK");
    console.error("Error creating card:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to create card",
      error: err.message
    });
  }
});

app.listen(3010, () => {
    console.log("server has started on port 3010")
})