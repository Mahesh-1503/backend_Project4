# Property Listing Backend API

**Frontend Developers/Fullstack-Developers:**
👉 Please read the [Frontend Developer Guide](./frontendGuide.md) for essential information on how to use this API from the frontend, including authentication, file uploads, best practices, and integration details. This guide is required reading for anyone developing the frontend of this project.

## Features

- **User Authentication & Authorization**: Secure registration, login, JWT-based authentication, and role-based access control (user, agent, admin).
- **Password Reset with OTP**: Users can reset their password using an OTP sent to their email.
- **Property Management**: Agents and admins can create, update, delete, and manage property listings with images, features, and advanced filtering.
- **Image Uploads**: Properties and user profiles support image uploads, stored via Cloudinary.
- **Favorites System**: Users can favorite/unfavorite properties for quick access.
- **Reviews & Ratings**: Authenticated users can leave reviews and ratings on properties. Admins can moderate reviews.
- **Property Visit Scheduling**: Users can request property visits, and agents can manage visit requests and time slots.
- **Contact System**: Users can send messages to property agents, and agents can reply.
- **User Profile Management**: Users can view and update their profile, including uploading a profile image.
- **Admin Dashboard**: Admins can view analytics, manage users, roles, and properties.
- **Security**: Input validation, password hashing, JWT, file upload restrictions, and (optionally) rate limiting.
- **Comprehensive Error Handling**: Consistent error responses and status codes for all endpoints.

# Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Properties](#properties)
  - [Users](#users)
  - [Reviews](#reviews)
  - [Visits](#visits)
  - [Contact](#contact)
  - [Profile](#profile)
  - [Admin](#admin)

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Postman (for API testing)

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/property-listing
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=your_email@gmail.com
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
MAX_FILE_UPLOAD=1000000
```

4. Start the server
```bash
npm run dev
```

## API Documentation

### Authentication

#### Register User
- **URL**: `POST /api/auth/register`
- **Body**:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user" // optional, defaults to "user"
}
```

#### Login
- **URL**: `POST /api/auth/login`
- **Body**:
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

#### Forgot Password
- **URL**: `POST /api/auth/forgotpassword`
- **Body**:
```json
{
    "email": "john@example.com"
}
```

#### Reset Password
- **URL**: `POST /api/auth/resetpassword`
- **Body**:
```json
{
    "email": "john@example.com",
    "otp": "123456",
    "password": "newpassword123"
}
```

### Properties

#### Get All Properties
- **URL**: `GET /api/properties`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sort`: Sort field (e.g., `-createdAt`)
  - `select`: Fields to select (e.g., `title,price`)
  - `search`: Search term
  - `propertyType`: Filter by property type
  - `listingType`: Filter by listing type (sale/rent)
  - `minPrice`: Minimum price
  - `maxPrice`: Maximum price

#### Get Single Property
- **URL**: `GET /api/properties/:id`

#### Create Property (Agent/Admin only)
- **URL**: `POST /api/properties`
- **Headers**: `Authorization: Bearer <token>`
- **Body** (multipart/form-data):
```json
{
    "title": "Luxury Apartment",
    "description": "Beautiful apartment in city center",
    "price": 500000,
    "location": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "zipCode": "10001"
    },
    "propertyType": "apartment",
    "listingType": "sale",
    "features": {
        "bedrooms": 2,
        "bathrooms": 2,
        "area": 1200,
        "parking": 1,
        "furnished": true
    },
    "images": [file1, file2]
}
```

#### Update Property (Agent/Admin only)
- **URL**: `PUT /api/properties/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same as create property

#### Delete Property (Agent/Admin only)
- **URL**: `DELETE /api/properties/:id`
- **Headers**: `Authorization: Bearer <token>`

### Reviews

#### Create Review
- **URL**: `POST /api/properties/:propertyId/reviews`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
    "rating": 5,
    "title": "Great Property",
    "comment": "Excellent location and amenities"
}
```

#### Get Property Reviews
- **URL**: `GET /api/properties/:propertyId/reviews`

#### Update Review
- **URL**: `PUT /api/reviews/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same as create review

#### Delete Review
- **URL**: `DELETE /api/reviews/:id`
- **Headers**: `Authorization: Bearer <token>`

### Visits

#### Request Property Visit
- **URL**: `POST /api/visits/properties/:propertyId/visits`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
    "visitDate": "2024-03-20",
    "visitTime": "14:30",
    "duration": 60,
    "notes": "Interested in viewing the property"
}
```

#### Get Available Time Slots
- **URL**: `GET /api/visits/properties/:propertyId/available-slots`
- **Query Parameters**:
  - `date`: Date in YYYY-MM-DD format

#### Get User's Visits
- **URL**: `GET /api/visits`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `status`: Filter by status (pending/approved/rejected/completed/cancelled)

#### Update Visit Status (Agent only)
- **URL**: `PUT /api/visits/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
    "status": "approved"
}
```

### Contact

#### Send Message to Agent
- **URL**: `POST /api/contact/:propertyId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
    "subject": "Property Inquiry",
    "message": "I'm interested in this property"
}
```

#### Get User's Messages
- **URL**: `GET /api/contact`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `status`: Filter by status (unread/read/replied/archived)

#### Reply to Message
- **URL**: `POST /api/contact/:id/reply`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
    "message": "Thank you for your interest"
}
```

### Profile

#### Get User Profile
- **URL**: `GET /api/profile`
- **Headers**: `Authorization: Bearer <token>`

#### Update Profile
- **URL**: `PUT /api/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
    "phone": "1234567890",
    "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
    },
    "bio": "Real estate enthusiast"
}
```

#### Upload Profile Image
- **URL**: `PUT /api/profile/image`
- **Headers**: `Authorization: Bearer <token>`
- **Body** (multipart/form-data):
  - `image`: Image file

### Admin

#### Get All Users (Admin only)
- **URL**: `GET /api/admin/users`
- **Headers**: `Authorization: Bearer <token>`

#### Update User Role (Admin only)
- **URL**: `PUT /api/admin/users/:id/role`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
    "role": "agent"
}
```

#### Get Dashboard Analytics (Admin only)
- **URL**: `GET /api/admin/dashboard`
- **Headers**: `Authorization: Bearer <token>`

## Testing with Postman

1. **Setup Postman Collection**
   - Create a new collection in Postman
   - Set up environment variables:
     - `base_url`: `http://localhost:5000`
     - `token`: Leave empty initially

2. **Authentication Flow**
   - Register a new user
   - Login to get the token
   - Copy the token from the response
   - Set the token in your environment variables

3. **Testing Protected Routes**
   - Add the token to request headers:
     ```
     Authorization: Bearer {{token}}
     ```

4. **Testing File Uploads**
   - Use form-data in Postman
   - Set the key type to "File" for image uploads

5. **Testing Query Parameters**
   - Use the "Params" tab in Postman
   - Add query parameters as needed

6. **Testing Different User Roles**
   - Create users with different roles (user, agent, admin)
   - Test role-specific endpoints with appropriate tokens

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error responses follow this format:
```json
{
    "success": false,
    "error": "Error message"
}
```

## Security Features

- JWT Authentication
- Password Hashing
- Role-based Access Control
- Input Validation
- File Upload Restrictions
- Rate Limiting (if implemented)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 