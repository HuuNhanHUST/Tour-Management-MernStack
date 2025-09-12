// Add basic pricing rule directly in MongoDB
db.getCollection('pricingrules').insertOne({
  "tourId": ObjectId("YOUR_TOUR_ID"), // Replace with your tour ID
  "name": "Standard Pricing",
  "description": "Default pricing rule with standard age brackets",
  "type": "ageBracket",
  "ageBrackets": [
    {
      "name": "Adult",
      "minAge": 18,
      "maxAge": 65,
      "discountType": "percentage",
      "discountValue": 0,
      "requiredId": false
    },
    {
      "name": "Child",
      "minAge": 2,
      "maxAge": 17,
      "discountType": "percentage",
      "discountValue": 50,
      "requiredId": false
    },
    {
      "name": "Infant",
      "minAge": 0,
      "maxAge": 1,
      "discountType": "percentage",
      "discountValue": 100,
      "requiredId": false
    },
    {
      "name": "Senior",
      "minAge": 66,
      "maxAge": 120,
      "discountType": "percentage",
      "discountValue": 30,
      "requiredId": false
    }
  ],
  "isActive": true,
  "createdAt": new Date(),
  "updatedAt": new Date()
})
