<h1>Video Platform API</h1>

### Overview

<p>Welcome to the Video Platform API! This project is the backend component of a video platform, providing API endpoints for managing videos. Built with Node.js, MongoDB Atlas for database management, and Cloudinary for video storage, this API facilitates video upload, management, and user authentication. Use Postman for API testing and interaction.</p>

### Features

• User Authentication: Secure registration and login for users.

• Video Upload: Upload and store videos using Cloudinary.

• Video Management: Retrieve and delete videos.

### Technologies

• Node.js: JavaScript runtime for backend development.

• MongoDB Atlas: Cloud-based NoSQL database for user and video data.

• Cloudinary: Media management and video storage.

• JavaScript: Programming language used for the backend.

• Postman: Tool for testing and interacting with the API.

<h2>Getting Started</h2>

### Prerequisites

Before you begin, ensure you have the following tools installed:

• Node.js (v14 or higher)

• MongoDB Atlas Account

• Cloudinary Account

## Installation

### 1. Clone the Repository

    git clone https://github.com/karanntech/Backend_Project.git

    cd Backend_Project 

### 2. Install Dependencies

  Ensure you have npm (Node Package Manager) installed. Run:

    npm install
   
### 3. Set Up Environment Variables

   Create a .env file in the root directory and add the following environment variables:

    PORT=5000
    
    MONGO_URI=your_mongodb_atlas_connection_string
    
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    
    JWT_SECRET=your_jwt_secret_key
    
Replace the placeholders with your actual credentials.

### Start the Server

    npm start
    
The server will start on http://localhost:5000.
