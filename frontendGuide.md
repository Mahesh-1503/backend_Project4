# Frontend Developer Guide for Property Listing Application

## Table of Contents
1. [API Base URL](#api-base-url)
2. [Authentication](#authentication)
3. [Property Management](#property-management)
4. [User Management](#user-management)
5. [Reviews System](#reviews-system)
6. [Property Visits](#property-visits)
7. [Contact System](#contact-system)
8. [Profile Management](#profile-management)
9. [Admin Features](#admin-features)
10. [Error Handling](#error-handling)
11. [File Upload Guidelines](#file-upload-guidelines)

## API Base URL
```
http://localhost:5000/api
```

## Authentication

### Register User
- **Endpoint**: `POST /auth/register`
- **Body**:
```json
{
    "name": "Mahesh",
    "email": "mahesh@gmail.com", //Use valid email this is just a template example
    "password": "password123",
    "role": "user"
}
```
- **Response**: Returns JWT token and user data
- **Note**: 
  - Role can be "user", "agent", or "admin"
  - Email must be a valid email format (e.g., user@domain.com)
  - Email validation is required on both frontend and backend

### Login
- **Endpoint**: `POST /auth/login`
- **Body**:
```json
{
    "email": "mahesh@gmail.com",
    "password": "password123"
}
```
- **Response**: Returns JWT token and user data
- **Note**: Email must be a valid email format

### Password Reset Flow
1. **Request OTP**
   - **Endpoint**: `POST /auth/forgot-password`
   - **Body**: `{ "email": "mahesh@gmail.com" }`
   - **Response**: Success message
   - **Note**: Email must be a valid email format

2. **Reset Password**
   - **Endpoint**: `POST /auth/reset-password`
   - **Body**:
   ```json
   {
       "email": "mahesh@gmail.com",
       "otp": "123456",
       "password": "newpassword123"
   }
   ```
   - **Response**: Success message
   - **Note**: Email must be a valid email format

### Authentication Headers
- Include JWT token in all protected requests:
```
Authorization: Bearer <token>
```

## Property Management

### Get All Properties
- **Endpoint**: `GET /properties`
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
- **Response**: Returns paginated properties with metadata

### Get Single Property
- **Endpoint**: `GET /properties/:id`
- **Response**: Returns detailed property information

### Create Property (Agent/Admin only)
- **Endpoint**: `POST /properties`
- **Content-Type**: `multipart/form-data`
- **Required Fields**:
  - `title`: String (max 100 chars)
  - `description`: String (max 2000 chars)
  - `price`: Number
  - `location`: Object with:
    - `street`: String
    - `city`: String
    - `state`: String
    - `country`: String
    - `zipCode`: String
  - `propertyType`: One of ['apartment', 'house', 'villa', 'condo', 'land', 'commercial']
  - `listingType`: One of ['sale', 'rent']
  - `features`: Object with:
    - `bedrooms`: Number
    - `bathrooms`: Number
    - `area`: Number
    - `parking`: Number
    - `furnished`: Boolean
  - `images`: Array of image files (max 10, max 5MB each)

### Update Property (Agent/Admin only)
- **Endpoint**: `PUT /properties/:id`
- **Body**: Same as create property
- **Note**: Only property owner or admin can update

### Delete Property (Agent/Admin only)
- **Endpoint**: `DELETE /properties/:id`
- **Note**: Only property owner or admin can delete

### Favorite/Unfavorite Property
- **Endpoints**:
  - Add to favorites: `PUT /properties/:id/favorite`
  - Remove from favorites: `PUT /properties/:id/unfavorite`
- **Note**: Requires authentication

## User Management

### Get User Profile
- **Endpoint**: `GET /profile`
- **Response**: Returns user profile with preferences

### Update Profile
- **Endpoint**: `PUT /profile`
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

### Upload Profile Image
- **Endpoint**: `PUT /profile/image`
- **Content-Type**: `multipart/form-data`
- **Body**: `image` file
- **Note**: Max file size 1MB

### Save Search Preferences
- **Endpoint**: `POST /profile/saved-searches`
- **Body**:
```json
{
    "name": "My Search",
    "filters": {
        "propertyType": "apartment",
        "minPrice": 100000,
        "maxPrice": 500000
    }
}
```

## Reviews System

### Create Review
- **Endpoint**: `POST /properties/:propertyId/reviews`
- **Body**:
```json
{
    "rating": 5,
    "title": "Great Property",
    "comment": "Excellent location and amenities"
}
```
- **Note**: One review per user per property

### Get Property Reviews
- **Endpoint**: `GET /properties/:propertyId/reviews`
- **Response**: Returns all approved reviews for the property

### Update Review
- **Endpoint**: `PUT /reviews/:id`
- **Body**: Same as create review
- **Note**: Only review owner or admin can update

### Delete Review
- **Endpoint**: `DELETE /reviews/:id`
- **Note**: Only review owner or admin can delete

## Property Visits

### Request Visit
- **Endpoint**: `POST /properties/:propertyId/visits`
- **Body**:
```json
{
    "visitDate": "2024-03-20",
    "visitTime": "14:30",
    "duration": 60,
    "notes": "Interested in viewing the property"
}
```

### Get Available Time Slots
- **Endpoint**: `GET /properties/:propertyId/available-slots`
- **Query Parameters**: `date` (YYYY-MM-DD)
- **Response**: Returns array of available time slots

### Get User's Visits
- **Endpoint**: `GET /visits`
- **Query Parameters**: `status` (pending/approved/rejected/completed/cancelled)
- **Response**: Returns user's visit requests

### Update Visit Status (Agent only)
- **Endpoint**: `PUT /visits/:id/status`
- **Body**: `{ "status": "approved" }`

## Contact System

### Send Message to Agent
- **Endpoint**: `POST /contact/:propertyId`
- **Body**:
```json
{
    "subject": "Property Inquiry",
    "message": "I'm interested in this property"
}
```

### Get Messages
- **Endpoint**: `GET /contact`
- **Query Parameters**: `status` (unread/read/replied/archived)
- **Response**: Returns user's messages

### Reply to Message
- **Endpoint**: `POST /contact/:id/reply`
- **Body**: `{ "message": "Thank you for your interest" }`

## Admin Features

### Get All Users
- **Endpoint**: `GET /admin/users`
- **Note**: Admin only

### Update User Role
- **Endpoint**: `PUT /admin/users/:id/role`
- **Body**: `{ "role": "agent" }`
- **Note**: Admin only

### Get Dashboard Analytics
- **Endpoint**: `GET /admin/dashboard`
- **Response**: Returns various analytics data
- **Note**: Admin only

## Error Handling

### Error Response Format
```json
{
    "success": false,
    "error": "Error message"
}
```

### Common Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## File Upload Guidelines

### Image Requirements
- **Property Images**:
  - Max 10 images per property
  - Max file size: 5MB
  - Allowed formats: JPEG, PNG, WebP
  - Images are stored in Cloudinary

### Profile Image Requirements
- **Profile Images**:
  - Max file size: 1MB
  - Allowed formats: JPEG, PNG, WebP
  - Images are stored in Cloudinary

### Upload Process
1. Use `multipart/form-data` for file uploads
2. Include authentication token in headers
3. Handle upload progress and errors
4. Implement retry mechanism for failed uploads

## Best Practices

1. **Authentication**:
   - Store JWT token securely (e.g., in HttpOnly cookies)
   - Implement token refresh mechanism
   - Handle token expiration gracefully

2. **Error Handling**:
   - Implement global error handling
   - Show user-friendly error messages
   - Log errors for debugging

3. **File Uploads**:
   - Implement client-side validation
   - Show upload progress
   - Handle failed uploads gracefully

4. **State Management**:
   - Cache API responses where appropriate
   - Implement optimistic updates
   - Handle loading and error states

5. **Security**:
   - Sanitize user inputs
   - Implement rate limiting
   - Use HTTPS for all requests

6. **Performance**:
   - Implement pagination for large lists
   - Use lazy loading for images
   - Cache frequently accessed data

7. **User Experience**:
   - Show loading indicators
   - Implement form validation
   - Provide feedback for user actions
