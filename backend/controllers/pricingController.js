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
    
    // Initialize base price from tour price
    const basePrice = tour.price;
    
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
      
      // Apply age bracket rules
      const ageBracketRules = pricingRules.filter(rule => 
        rule.type === "ageBracket" && rule.ageBrackets && rule.ageBrackets.length > 0
      );
      
      for (const rule of ageBracketRules) {
        for (const bracket of rule.ageBrackets) {
          // Check if guest falls within this age bracket
          if (
            (bracket.minAge === undefined || age >= bracket.minAge) && 
            (bracket.maxAge === undefined || age <= bracket.maxAge) &&
            (
              bracket.name.toLowerCase() === guestType ||
              (bracket.name.toLowerCase() === "adult" && guestType === "adult") ||
              (bracket.name.toLowerCase() === "child" && guestType === "child") ||
              (bracket.name.toLowerCase() === "infant" && guestType === "infant") ||
              (bracket.name.toLowerCase() === "senior" && guestType === "senior") ||
              (bracket.name.toLowerCase() === "student" && guestType === "student")
            )
          ) {
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
            
            break; // Apply only one age bracket rule per guest
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
