const express = require('express');
const app = express()
const cors = require("cors");
const pool = require("./db")

app.use(cors());
// Increase JSON request size limit to handle larger avatar images
app.use(express.json({ limit: '10mb' }));

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
  name VARCHAR(255) NOT NULL,
  headline VARCHAR(255) NOT NULL,
  bio VARCHAR(255),
  company_name VARCHAR(255),
  company_url VARCHAR(255),
  social_media_id INTEGER REFERENCES social_media(social_media_id),
  meeting_link VARCHAR(255),
  personal_website VARCHAR(255),
  additional_urls VARCHAR(255),
  background_color VARCHAR(30) DEFAULT '#ffffff', -- Background color field
  avatar_bg_color VARCHAR(30) DEFAULT '#d2e961', -- Avatar background color field
  avatar TEXT -- Field for profile avatar image data (base64)
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
      name,
      headline, 
      bio, 
      company_name,
      company_url,
      meeting_link, 
      personal_website,
      additional_urls,
      background_color, // Field for card background color
      avatar_bg_color, // Field for avatar background color
      avatar, // Field for profile avatar
      social_media 
    } = req.body;
    
    // Check if this is the first card (to make it default)
    const countResult = await pool.query("SELECT COUNT(*) FROM cards");
    const isFirstCard = parseInt(countResult.rows[0].count) === 0;
    
    // 1. Create card entry (parent record in cards table)
    const cardResult = await pool.query(
      "INSERT INTO cards (card_name, is_default) VALUES ($1, $2) RETURNING card_id, card_name",
      [card_name, isFirstCard]  // Set is_default to true if this is the first card
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
      "INSERT INTO card (card_id, card_name, name, headline, bio, company_name, company_url, social_media_id, meeting_link, personal_website, additional_urls, background_color, avatar_bg_color, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *",
      [cardId, savedCardName, name, headline, bio, company_name, company_url, socialMediaId, meeting_link, personal_website, additional_urls, background_color || '#ffffff', avatar_bg_color || '#d2e961', avatar || null]
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

// Set a card as default
app.put("/cards/:id/set-default", async (req, res) => {
  try {
    const { id } = req.params;

    // Begin transaction
    await pool.query("BEGIN");
    
    // First, clear default status from all cards
    await pool.query(
      "UPDATE cards SET is_default = false"
    );
    
    // Then, set the specified card as default
    const result = await pool.query(
      "UPDATE cards SET is_default = true WHERE card_id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        status: "error",
        message: "Card not found"
      });
    }
    
    // Commit transaction
    await pool.query("COMMIT");
    
    res.json({
      status: "success",
      message: "Card set as default",
      data: {
        card: result.rows[0]
      }
    });
  } catch (err) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK");
    console.error("Error setting default card:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to set default card",
      error: err.message
    });
  }
});

// Get all cards
app.get("/cards", async (req, res) => {
  try {
    // Query to get all cards with their associated social media info
    const result = await pool.query(`
      SELECT c.*, cd.*, sm.*
      FROM cards cd
      JOIN card c ON c.card_id = cd.card_id
      LEFT JOIN social_media sm ON c.social_media_id = sm.social_media_id
      ORDER BY cd.is_default DESC, cd.date_created DESC
    `);

    if (result.rows.length === 0) {
      return res.json({
        status: "success",
        message: "No cards found",
        data: {
          cards: []
        }
      });
    }

    res.json({
      status: "success",
      data: {
        cards: result.rows
      }
    });
  } catch (err) {
    console.error("Error fetching cards:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch cards",
      error: err.message
    });
  }
});

// Get the default card
app.get("/cards/default", async (req, res) => {
  try {
    // Query to get the default card with associated social media info
    const result = await pool.query(`
      SELECT c.*, cd.*, sm.*
      FROM cards cd
      JOIN card c ON c.card_id = cd.card_id
      LEFT JOIN social_media sm ON c.social_media_id = sm.social_media_id
      WHERE cd.is_default = true
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No default card found"
      });
    }

    res.json({
      status: "success",
      data: {
        card: result.rows[0]
      }
    });
  } catch (err) {
    console.error("Error fetching default card:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch default card",
      error: err.message
    });
  }
});

// Edit an existing card
app.put("/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    await pool.query("BEGIN");
    
    // Extract data from request body
    const { 
      card_name,
      name,
      headline, 
      bio, 
      company_name,
      company_url,
      meeting_link, 
      personal_website,
      additional_urls,
      background_color,
      avatar_bg_color,
      avatar,
      social_media 
    } = req.body;
    
    // 1. Check if the card exists
    const checkResult = await pool.query(
      "SELECT card_id FROM cards WHERE card_id = $1",
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        status: "error",
        message: "Card not found"
      });
    }
    
    // 2. Update the cards entry
    const cardsUpdateResult = await pool.query(
      "UPDATE cards SET card_name = $1, date_updated = CURRENT_TIMESTAMP WHERE card_id = $2 RETURNING card_id, card_name",
      [card_name, id]
    );
    
    // Get the updated card name to ensure consistency
    const updatedCardName = cardsUpdateResult.rows[0].card_name;
    
    // 3. Get the social_media_id linked to this card
    const socialMediaIdResult = await pool.query(
      "SELECT social_media_id FROM card WHERE card_id = $1",
      [id]
    );
    
    const socialMediaId = socialMediaIdResult.rows[0].social_media_id;
    
    // 4. Update social media entry
    await pool.query(
      "UPDATE social_media SET linkedin = $1, twitter = $2, instagram = $3, github = $4, facebook = $5 WHERE social_media_id = $6",
      [social_media.linkedin, social_media.twitter, social_media.instagram, social_media.github, social_media.facebook, socialMediaId]
    );
    
    // 5. Update card entry
    const cardUpdateResult = await pool.query(
      "UPDATE card SET card_name = $1, name = $2, headline = $3, bio = $4, company_name = $5, company_url = $6, meeting_link = $7, personal_website = $8, additional_urls = $9, background_color = $10, avatar_bg_color = $11, avatar = $12, date_updated = CURRENT_TIMESTAMP WHERE card_id = $13 RETURNING *",
      [updatedCardName, name, headline, bio, company_name, company_url, meeting_link, personal_website, additional_urls, background_color || '#ffffff', avatar_bg_color || '#d2e961', avatar || null, id]
    );
    
    // Commit transaction
    await pool.query("COMMIT");
    
    // Get the updated social media record to return in response
    const updatedSocialMedia = await pool.query(
      "SELECT * FROM social_media WHERE social_media_id = $1",
      [socialMediaId]
    );
    
    res.json({
      status: "success",
      message: "Card updated successfully",
      data: {
        card: cardUpdateResult.rows[0],
        social_media: updatedSocialMedia.rows[0]
      }
    });
    
  } catch (err) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK");
    console.error("Error updating card:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to update card",
      error: err.message
    });
  }
});

// Delete a card
app.delete("/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    await pool.query("BEGIN");
    
    // Check if the card exists
    const checkResult = await pool.query(
      "SELECT card_id FROM cards WHERE card_id = $1",
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        status: "error",
        message: "Card not found"
      });
    }

    // Check if this is the default card
    const defaultCheckResult = await pool.query(
      "SELECT is_default FROM cards WHERE card_id = $1",
      [id]
    );
    
    const isDefault = defaultCheckResult.rows[0].is_default;
    
    // Get the social_media_id linked to this card
    const socialMediaIdResult = await pool.query(
      "SELECT social_media_id FROM card WHERE card_id = $1",
      [id]
    );
    
    const socialMediaId = socialMediaIdResult.rows[0].social_media_id;
    
    // Delete the card (child) record first
    await pool.query(
      "DELETE FROM card WHERE card_id = $1",
      [id]
    );
    
    // Delete the social media record
    await pool.query(
      "DELETE FROM social_media WHERE social_media_id = $1",
      [socialMediaId]
    );
    
    // Delete the cards (parent) record
    await pool.query(
      "DELETE FROM cards WHERE card_id = $1",
      [id]
    );
    
    // If this was the default card and there are other cards,
    // set a new default
    if (isDefault) {
      const remainingCardsResult = await pool.query(
        "SELECT card_id FROM cards ORDER BY date_created DESC LIMIT 1"
      );
      
      if (remainingCardsResult.rows.length > 0) {
        // Set the most recently created card as default
        await pool.query(
          "UPDATE cards SET is_default = true WHERE card_id = $1",
          [remainingCardsResult.rows[0].card_id]
        );
      }
    }
    
    // Commit transaction
    await pool.query("COMMIT");
    
    res.json({
      status: "success",
      message: "Card deleted successfully"
    });
    
  } catch (err) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK");
    console.error("Error deleting card:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to delete card",
      error: err.message
    });
  }
});

app.listen(3010, () => {
    console.log("server has started on port 3010")
})