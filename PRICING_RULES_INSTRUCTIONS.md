# Creating Pricing Rules to Fix Booking Issues

The reason you're seeing the error message "Booking validation failed: basePrice: Path `basePrice` is required" is because there are no pricing rules set up for your tours. The pricing rules are essential for calculating the basePrice and guest prices during the booking process.

## Option 1: Creating Pricing Rules through the Admin Interface

1. **Log in as an Admin User**
   - Make sure you have an admin account
   - If you don't have an admin account, you can update a user to admin in MongoDB directly:
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

2. **Access the Admin Dashboard**
   - Navigate to the admin section of your application
   - Find the "Pricing Management" or similar section

3. **Create a Basic Pricing Rule**
   - For each tour, create an "Age Bracket" pricing rule with the following settings:
     - **Name**: "Standard Pricing for [Tour Name]"
     - **Description**: "Default pricing rule with standard age brackets"
     - **Type**: "Age Bracket"
     - **Add the following age brackets**:
       - Adult (18-65): 0% discount (base price)
       - Child (2-17): 50% discount
       - Infant (0-1): 100% discount (free)
       - Senior (66+): 30% discount

## Option 2: Creating Pricing Rules using MongoDB Directly

If you don't have an admin interface or prefer to use MongoDB directly, you can insert pricing rules with the following script:

```javascript
// Connect to your MongoDB database and run the following for each tour:
db.pricingrules.insertOne({
  tourId: ObjectId("your-tour-id"),  // Replace with actual tour ID
  name: "Standard Pricing",
  description: "Default pricing rule with standard age brackets",
  type: "ageBracket",
  ageBrackets: [
    {
      name: "Adult",
      minAge: 18,
      maxAge: 65,
      discountType: "percentage",
      discountValue: 0,
      requiredId: false
    },
    {
      name: "Child",
      minAge: 2,
      maxAge: 17,
      discountType: "percentage",
      discountValue: 50,
      requiredId: false
    },
    {
      name: "Infant",
      minAge: 0,
      maxAge: 1,
      discountType: "percentage",
      discountValue: 100,
      requiredId: false
    },
    {
      name: "Senior",
      minAge: 66,
      maxAge: 120,
      discountType: "percentage",
      discountValue: 30,
      requiredId: false
    }
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Option 3: Creating a New Admin User Directly in MongoDB

If you don't have an admin user, you can create one directly in MongoDB:

```javascript
// Make sure to hash the password properly; this is just an example
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "hashed-password", // Use proper hashing like bcrypt
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

After creating pricing rules for your tours, you should be able to book them successfully!
