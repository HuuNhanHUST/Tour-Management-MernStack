import PricingRule from '../models/PricingRule.js';
import Tour from '../models/Tour.js';

// Create a new pricing rule
export const createPricingRule = async (req, res) => {
  try {
    const { tourId } = req.body;
    
    // Verify the tour exists
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại."
      });
    }
    
    const newRule = new PricingRule(req.body);
    const savedRule = await newRule.save();
    
    res.status(201).json({
      success: true,
      message: "Đã tạo quy tắc giá mới thành công.",
      data: savedRule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all pricing rules
export const getAllPricingRules = async (req, res) => {
  try {
    const rules = await PricingRule.find().populate('tourId', 'title');
    
    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get pricing rules for a specific tour
export const getPricingRulesByTourId = async (req, res) => {
  try {
    const { tourId } = req.params;
    
    const rules = await PricingRule.find({ tourId, isActive: true });
    
    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get pricing rule by ID
export const getPricingRuleById = async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id).populate('tourId', 'title');
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Quy tắc giá không tồn tại."
      });
    }
    
    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update pricing rule
export const updatePricingRule = async (req, res) => {
  try {
    const updatedRule = await PricingRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedRule) {
      return res.status(404).json({
        success: false,
        message: "Quy tắc giá không tồn tại."
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Cập nhật quy tắc giá thành công.",
      data: updatedRule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete pricing rule
export const deletePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Quy tắc giá không tồn tại."
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Đã xóa quy tắc giá thành công."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Calculate price based on pricing rules
export const calculatePrice = async (req, res) => {
  try {
    const { 
      tourId, 
      bookingDate, 
      guests, 
      singleRoomCount = 0 
    } = req.body;
    
    console.log("=== PRICING CALCULATION BACKEND DEBUG ===");
    console.log("Tour ID:", tourId);
    console.log("Booking Date:", bookingDate);
    console.log("Guests received:", guests.map(g => ({
      fullName: g.fullName,
      age: g.age,
      guestType: g.guestType
    })));
    console.log("Single Room Count:", singleRoomCount);
    
    if (!tourId || !bookingDate || !guests || guests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thông tin đặt tour không đầy đủ."
      });
    }
    
    // Find the tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại."
      });
    }
    
    // Get pricing rules for this tour
    const pricingRules = await PricingRule.find({ tourId, isActive: true });
    console.log("Found pricing rules:", pricingRules.length);
    console.log("Pricing rules details:", pricingRules.map(r => ({
      name: r.name,
      type: r.type,
      ageBrackets: r.ageBrackets
    })));
    
    // Initialize base price from tour price
    const basePrice = tour.price;
    console.log("Base price:", basePrice);
    
    // Initialize pricing results
    const pricingResults = {
      basePrice,
      totalAmount: 0,
      guestPrices: [],
      appliedDiscounts: [],
      appliedSurcharges: []
    };
    
    // Calculate prices for each guest
    for (const guest of guests) {
      const { age, guestType } = guest;
      let guestPrice = basePrice;
      const guestDiscounts = [];
      const guestSurcharges = [];
      
      console.log(`\n=== Processing Guest: ${guest.fullName} ===`);
      console.log(`Age: ${age}, Guest Type: ${guestType}`);
      
      // Apply age bracket rules
      const ageBracketRules = pricingRules.filter(rule => 
        rule.type === "ageBracket" && rule.ageBrackets && rule.ageBrackets.length > 0
      );
      
      console.log(`Found ${ageBracketRules.length} age bracket rules`);
      
      for (const rule of ageBracketRules) {
        console.log(`\nChecking rule: ${rule.name}`);
        console.log(`Rule age brackets:`, rule.ageBrackets);
        
        for (const bracket of rule.ageBrackets) {
          console.log(`\nChecking bracket: ${bracket.name}`);
          console.log(`Min Age: ${bracket.minAge}, Max Age: ${bracket.maxAge}`);
          console.log(`Discount Type: ${bracket.discountType}, Value: ${bracket.discountValue}`);
          
          // Check if guest falls within this age bracket
          const ageMatches = (bracket.minAge === undefined || age >= bracket.minAge) && 
                            (bracket.maxAge === undefined || age <= bracket.maxAge);
          
          console.log(`Age matches (${age} in ${bracket.minAge}-${bracket.maxAge}): ${ageMatches}`);
          
          // Improved guest type matching
          const nameMatch = bracket.name?.toLowerCase() === guestType?.toLowerCase();
          const typeMatches = nameMatch ||
            (bracket.name?.toLowerCase().includes('lớn') && guestType === "adult") ||
            (bracket.name?.toLowerCase().includes('adult') && guestType === "adult") ||
            (bracket.name?.toLowerCase().includes('trẻ em') && guestType === "child") ||
            (bracket.name?.toLowerCase().includes('child') && guestType === "child") ||
            (bracket.name?.toLowerCase().includes('em bé') && guestType === "infant") ||
            (bracket.name?.toLowerCase().includes('infant') && guestType === "infant") ||
            (bracket.name?.toLowerCase().includes('cao tuổi') && guestType === "senior") ||
            (bracket.name?.toLowerCase().includes('senior') && guestType === "senior") ||
            (bracket.name?.toLowerCase().includes('student') && guestType === "student");
          
          console.log(`Type matches: ${typeMatches} (bracket: ${bracket.name}, guest: ${guestType})`);
          
          if (ageMatches && typeMatches) {
            let discountAmount = 0;
            
            if (bracket.discountType === "percentage") {
              discountAmount = basePrice * (bracket.discountValue / 100);
            } else {
              discountAmount = bracket.discountValue;
            }
            
            guestPrice -= discountAmount;
            guestDiscounts.push({
              name: `${bracket.name} (${rule.name})`,
              amount: discountAmount
            });
            
            // Add to overall discounts for reporting
            pricingResults.appliedDiscounts.push({
              name: `${bracket.name} (${rule.name})`,
              amount: discountAmount
            });
            
            console.log(`✅ APPLIED DISCOUNT: ${discountAmount} (${bracket.discountType})`);
            console.log(`New guest price: ${guestPrice}`);
            
            break; // Apply only one age bracket rule per guest
          } else {
            console.log(`❌ No match - Age: ${ageMatches}, Type: ${typeMatches}`);
          }
        }
      }
      
      // Add the guest price to results
      pricingResults.guestPrices.push({
        guestType,
        age,
        basePrice,
        finalPrice: guestPrice,
        discounts: guestDiscounts,
        surcharges: guestSurcharges
      });
      
      pricingResults.totalAmount += guestPrice;
    }
    
    // Apply seasonal pricing
    const bookingDateObj = new Date(bookingDate);
    const seasonalRules = pricingRules.filter(rule => 
      rule.type === "seasonal" && rule.seasonalPricing && rule.seasonalPricing.length > 0
    );
    
    for (const rule of seasonalRules) {
      for (const season of rule.seasonalPricing) {
        if (
          bookingDateObj >= new Date(season.startDate) && 
          bookingDateObj <= new Date(season.endDate)
        ) {
          const seasonalAdjustment = pricingResults.totalAmount * (season.priceMultiplier - 1);
          
          if (seasonalAdjustment !== 0) {
            if (seasonalAdjustment > 0) {
              // It's a surcharge
              pricingResults.appliedSurcharges.push({
                name: `${season.name} (${rule.name})`,
                amount: seasonalAdjustment
              });
            } else {
              // It's a discount
              pricingResults.appliedDiscounts.push({
                name: `${season.name} (${rule.name})`,
                amount: Math.abs(seasonalAdjustment)
              });
            }
            
            pricingResults.totalAmount += seasonalAdjustment;
          }
          
          break; // Apply only one seasonal rule
        }
      }
    }
    
    // Apply promotion pricing (Early Bird, Last Minute)
    const promotionRules = pricingRules.filter(rule => 
      rule.type === "promotion" && rule.promotion
    );
    
    const daysToDeparture = Math.ceil(
      (new Date(tour.startDate) - new Date(bookingDate)) / (1000 * 60 * 60 * 24)
    );
    
    for (const rule of promotionRules) {
      const promotion = rule.promotion;
      
      // Check if today is within the promotion period
      const today = new Date();
      
      if (
        (!promotion.startDate || today >= new Date(promotion.startDate)) &&
        (!promotion.endDate || today <= new Date(promotion.endDate))
      ) {
        // Early bird check
        if (
          promotion.daysBeforeDeparture && 
          daysToDeparture >= promotion.daysBeforeDeparture
        ) {
          let discountAmount = 0;
          
          if (promotion.discountType === "percentage") {
            discountAmount = pricingResults.totalAmount * (promotion.discountValue / 100);
          } else {
            discountAmount = promotion.discountValue;
          }
          
          pricingResults.totalAmount -= discountAmount;
          pricingResults.appliedDiscounts.push({
            name: `${promotion.name} (${rule.name})`,
            amount: discountAmount
          });
        }
        
        // Last minute check
        if (
          promotion.daysBeforeDepartureMax && 
          daysToDeparture <= promotion.daysBeforeDepartureMax
        ) {
          let discountAmount = 0;
          
          if (promotion.discountType === "percentage") {
            discountAmount = pricingResults.totalAmount * (promotion.discountValue / 100);
          } else {
            discountAmount = promotion.discountValue;
          }
          
          pricingResults.totalAmount -= discountAmount;
          pricingResults.appliedDiscounts.push({
            name: `${promotion.name} (${rule.name})`,
            amount: discountAmount
          });
        }
      }
    }
    
    // Apply surcharges
    const surchargeRules = pricingRules.filter(rule => 
      rule.type === "surcharge" && rule.surcharge
    );
    
    for (const rule of surchargeRules) {
      const surcharge = rule.surcharge;
      
      // Single room surcharge
      if (surcharge.applicableType === "singleRoom" && singleRoomCount > 0) {
        let surchargeAmount = 0;
        
        if (surcharge.chargeType === "percentage") {
          surchargeAmount = basePrice * (surcharge.chargeValue / 100) * singleRoomCount;
        } else {
          surchargeAmount = surcharge.chargeValue * singleRoomCount;
        }
        
        pricingResults.totalAmount += surchargeAmount;
        pricingResults.appliedSurcharges.push({
          name: `${surcharge.name} (${rule.name})`,
          amount: surchargeAmount
        });
      }
      
      // Weekend surcharge
      if (surcharge.applicableType === "weekend") {
        const bookingDay = bookingDateObj.getDay(); // 0 = Sunday, 6 = Saturday
        
        if (surcharge.daysOfWeek && surcharge.daysOfWeek.includes(bookingDay)) {
          let surchargeAmount = 0;
          
          if (surcharge.chargeType === "percentage") {
            surchargeAmount = pricingResults.totalAmount * (surcharge.chargeValue / 100);
          } else {
            surchargeAmount = surcharge.chargeValue;
          }
          
          pricingResults.totalAmount += surchargeAmount;
          pricingResults.appliedSurcharges.push({
            name: `${surcharge.name} (${rule.name})`,
            amount: surchargeAmount
          });
        }
      }
      
      // Holiday surcharge
      if (surcharge.applicableType === "holiday" && surcharge.dates) {
        const bookingDateStr = bookingDateObj.toISOString().split('T')[0];
        
        const isHoliday = surcharge.dates.some(date => {
          const holidayStr = new Date(date).toISOString().split('T')[0];
          return holidayStr === bookingDateStr;
        });
        
        if (isHoliday) {
          let surchargeAmount = 0;
          
          if (surcharge.chargeType === "percentage") {
            surchargeAmount = pricingResults.totalAmount * (surcharge.chargeValue / 100);
          } else {
            surchargeAmount = surcharge.chargeValue;
          }
          
          pricingResults.totalAmount += surchargeAmount;
          pricingResults.appliedSurcharges.push({
            name: `${surcharge.name} (${rule.name})`,
            amount: surchargeAmount
          });
        }
      }
    }
    
    // Round total to 2 decimal places
    pricingResults.totalAmount = Math.round(pricingResults.totalAmount * 100) / 100;
    
    res.status(200).json({
      success: true,
      data: pricingResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
