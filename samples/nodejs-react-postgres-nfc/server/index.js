const express = require('express');
const app = express()
const cors = require("cors");
const pool = require("./db")

app.use(cors());
app.use(express.json())

// Create the social_media table first (referenced table)
const createSocialMediaTable = `CREATE TABLE IF NOT EXISTS social_media(
  social_media_id SERIAL PRIMARY KEY,
  linkedin VARCHAR(255),
  twitter VARCHAR(255),
  instagram VARCHAR(255),
  github VARCHAR(255),
  facebook VARCHAR(255)
)`

// Create the profile table second (main table)
const createProfileTable = `CREATE TABLE IF NOT EXISTS profile(
  card_id SERIAL PRIMARY KEY, -- Auto-incrementing integer
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
    await pool.query(createSocialMediaTable);
    await pool.query(createProfileTable);
    console.log("Database tables created successfully");
  } catch (err) {
    console.error("Error creating database tables:", err);
  }
}

// Initialize database
initDatabase();

// Routes
// Create a new profile with social media links
app.post("/profiles", async (req, res) => {
  try {
    // Begin transaction
    await pool.query("BEGIN");
    
    // Extract data from request body
    const { 
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
    
    // 1. Create social media entry first
    const socialMediaResult = await pool.query(
      "INSERT INTO social_media (linkedin, twitter, instagram, github, facebook) VALUES ($1, $2, $3, $4, $5) RETURNING social_media_id",
      [social_media.linkedin, social_media.twitter, social_media.instagram, social_media.github, social_media.facebook]
    );
    
    const socialMediaId = socialMediaResult.rows[0].social_media_id;
    
    // 2. Create profile with reference to social media
    const profileResult = await pool.query(
      "INSERT INTO profile (first_name, last_name, additional_name, headline, bio, social_media_id, meeting_link, personal_website, additional_urls) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [first_name, last_name, additional_name, headline, bio, socialMediaId, meeting_link, personal_website, additional_urls]
    );
    
    // Commit transaction
    await pool.query("COMMIT");
    
    res.status(201).json({
      status: "success",
      data: {
        profile: profileResult.rows[0],
        social_media: social_media
      }
    });
    
  } catch (err) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK");
    console.error("Error creating profile:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to create profile",
      error: err.message
    });
  }
});

app.listen(3010, () => {
    console.log("server has started on port 3010")
})