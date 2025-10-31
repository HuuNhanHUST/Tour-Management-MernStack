# 🧪 Design Unification Testing Guide

## ✅ Quick Verification Steps

### 1️⃣ Visual Inspection Checklist

#### **Open a Tour Details Page**
Navigate to: `http://localhost:3000/tours/:tourId`

**Verify TourDetails Component:**
- [ ] Cards use 12px border-radius
- [ ] No visible borders (shadow-only design)
- [ ] Section headers have large orange icons
- [ ] Hover effects work (cards lift on hover)
- [ ] Overall modern, clean appearance

#### **Open Booking Section**
Scroll down to booking form or navigate to booking flow

**Verify Booking Component:**
- [ ] Main booking card matches TourDetails card styling
- [ ] Border-radius is 12px on all cards
- [ ] White background on all sections
- [ ] Shadows instead of borders
- [ ] All section headers have icons

---

### 2️⃣ Multi-Step Booking Flow Test

#### **Step 1: Select Options**
1. Navigate to a tour page
2. Scroll to booking section
3. **Verify:**
   - [ ] "Thời gian tour" section has calendar icon (📅)
   - [ ] "Thông tin khách đi tour" section has group icon (👥)
   - [ ] "Ước tính giá" section has money icon (💰)
   - [ ] All sections have white background
   - [ ] Guest info cards have hover animation
   - [ ] Border-radius is 12px on all cards

#### **Step 2: Guest Information**
1. Click "Tiếp tục →" button after selecting guests
2. **Verify:**
   - [ ] "Thông tin người đặt tour" has user icon (👤)
   - [ ] "Chi tiết thông tin khách" has team icon (👥)
   - [ ] "Địa chỉ đón khách" has map pin icon (📍)
   - [ ] "Tóm tắt đặt tour" has file list icon (📋)
   - [ ] Input fields have 8px border-radius
   - [ ] Input focus shows orange glow effect

#### **Step 3: Payment**
1. Fill all information and click "Tiếp tục →"
2. **Verify:**
   - [ ] "Thông tin đặt tour" has info icon (ℹ️)
   - [ ] "Danh sách khách" has team icon (👥)
   - [ ] "Chi tiết giá" has money icon (💰)
   - [ ] "Chọn phương thức thanh toán" has card icon (💳)
   - [ ] Payment method cards have hover effects
   - [ ] Button has orange glow on hover

---

### 3️⃣ Interactive Elements Test

#### **Hover Effects**
Test these elements:
- [ ] Main booking card (should lift slightly)
- [ ] Booking sections (shadow increases)
- [ ] Guest info cards (lift + shadow increase)
- [ ] Buttons (lift + orange glow)

**Expected Behavior:**
- Smooth 0.3s transition
- Transform: translateY(-2px)
- Shadow expansion

#### **Focus Effects**
Test all form inputs:
- [ ] Text inputs (name, phone, address)
- [ ] Number inputs (age, single room count)
- [ ] Select dropdowns (guest type, location)

**Expected Behavior:**
- Orange border on focus
- Orange glow shadow: `0 0 0 3px rgba(255,126,1,0.1)`
- Smooth transition

---

### 4️⃣ Responsive Testing

#### **Desktop (>992px)**
- [ ] All cards display properly
- [ ] Icons are visible and properly sized
- [ ] Hover effects work smoothly
- [ ] Layout is balanced

#### **Tablet (768px - 992px)**
- [ ] Cards stack appropriately
- [ ] Icons remain visible
- [ ] Padding adjusts properly
- [ ] No horizontal overflow

#### **Mobile (<768px)**
- [ ] Single column layout
- [ ] Cards have proper spacing
- [ ] Icons scale down if needed
- [ ] Touch interactions work
- [ ] No layout breaks

---

### 5️⃣ Cross-Browser Testing

Test in these browsers:
- [ ] **Chrome/Edge** (Chromium-based)
- [ ] **Firefox**
- [ ] **Safari** (if on Mac)

**Verify:**
- Border-radius renders correctly
- Shadows display properly
- Hover effects work
- Focus states work
- Transitions are smooth

---

### 6️⃣ Accessibility Testing

#### **Keyboard Navigation**
- [ ] Tab through all form inputs
- [ ] Focus states are clearly visible
- [ ] Orange glow indicates focus
- [ ] Tab order is logical

#### **Screen Reader**
- [ ] Section headers are properly announced
- [ ] Icons have proper ARIA labels (if applicable)
- [ ] Form labels are associated with inputs

---

## 🐛 Common Issues & Solutions

### Issue 1: Icons Not Showing
**Symptoms:** Icon boxes appear empty  
**Cause:** Remix Icons not loaded  
**Solution:** 
```jsx
// Verify in index.html or App.js:
<link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet">
```

### Issue 2: Hover Effects Not Working
**Symptoms:** No animation on hover  
**Cause:** CSS not applied or browser issue  
**Solution:** 
- Clear browser cache (Ctrl+Shift+R)
- Check DevTools for CSS conflicts
- Verify `.booking-section:hover` exists in CSS

### Issue 3: Border-radius Not Uniform
**Symptoms:** Some cards still have old radius  
**Cause:** CSS specificity or overrides  
**Solution:**
- Inspect element in DevTools
- Check for conflicting CSS rules
- Add `!important` if necessary (last resort)

### Issue 4: Focus Glow Not Visible
**Symptoms:** No orange glow on input focus  
**Cause:** Box-shadow may be overridden  
**Solution:**
```css
input:focus, select:focus {
  outline: none;
  border-color: var(--secondary-color);
  box-shadow: 0 0 0 3px rgba(255,126,1,0.1) !important;
}
```

---

## 📸 Screenshot Checklist

Take screenshots of:
1. [ ] TourDetails page (full view)
2. [ ] Booking Step 1 (with icons visible)
3. [ ] Booking Step 2 (with icons visible)
4. [ ] Booking Step 3 (with icons visible)
5. [ ] Hover state on card
6. [ ] Focus state on input
7. [ ] Mobile view (responsive)

Save in: `frontend/public/screenshots/design-unification/`

---

## ✅ Acceptance Criteria

### Must Pass ✅
- [x] All compilation errors resolved
- [ ] All icons display correctly
- [ ] Border-radius is 12px on cards
- [ ] Border-radius is 8px on inputs/buttons
- [ ] Hover effects work on all interactive elements
- [ ] Focus states show orange glow
- [ ] No visible borders on cards (shadow-only)
- [ ] White background on all booking sections
- [ ] Responsive on all screen sizes
- [ ] No console errors

### Nice to Have ⭐
- [ ] Animations are smooth (60fps)
- [ ] Loading states are elegant
- [ ] Error states are clear
- [ ] Success states are celebratory

---

## 🎉 Testing Complete!

If all checkboxes are ✅, the design unification is successful!

**Sign-off:**
- Tester: _______________
- Date: _______________
- Status: ⬜ Pass ⬜ Fail ⬜ Needs Revision

---

## 📝 Bug Report Template

If issues found, use this template:

```markdown
### Bug Report

**Issue:** [Brief description]
**Location:** Step 1 / Step 2 / Step 3 / TourDetails
**Browser:** Chrome / Firefox / Safari / Edge
**Screen Size:** Desktop / Tablet / Mobile
**Severity:** 🔴 Critical / 🟡 Major / 🟢 Minor

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Observe...

**Screenshot:**
[Attach screenshot if applicable]

**Suggested Fix:**
[Optional: Your suggestion]
```

---

**Testing URL:** http://localhost:3000  
**Documentation:** DESIGN_UNIFICATION_COMPLETE.md  
**Last Updated:** October 30, 2025
