# Support Portal Test Report

**Generated:** 2025-11-19T01:34:07.751Z

**Support Portal URL:** http://localhost:45004

**Test Credentials:** support@cuts.ae

## Summary

- **Total Tests:** 8
- **Passed:** 6
- **Failed:** 2
- **Warnings:** 0
- **Success Rate:** 75.00%

## Console Errors

Found 2 console error(s):

### Error 1 (login page)
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```
**Time:** 2025-11-19T01:34:11.552Z

### Error 2 (dashboard page)
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```
**Time:** 2025-11-19T01:34:46.590Z

## Network Errors

No network errors detected.

## Detailed Test Results

### Login Page

#### [PASS] Login Page - Navigation
- **Status:** PASS
- **Details:** Status: 200
- **Screenshot:** `/Users/sour/Projects/cuts.ae/restaurant/test-screenshots/support-portal/login_page_initial_1763516049382.png`
- **Time:** 2025-11-19T01:34:09.453Z

#### [PASS] Login Page - Title
- **Status:** PASS
- **Details:** Title: "Support Portal - Cuts.ae"
- **Time:** 2025-11-19T01:34:09.454Z

#### [PASS] Login Page - Email Input
- **Status:** PASS
- **Details:** Email input field found
- **Time:** 2025-11-19T01:34:09.460Z

#### [PASS] Login Page - Password Input
- **Status:** PASS
- **Details:** Password input field found
- **Time:** 2025-11-19T01:34:09.460Z

#### [PASS] Login Page - Submit Button
- **Status:** PASS
- **Details:** Submit button found
- **Time:** 2025-11-19T01:34:09.461Z

#### [PASS] Login Page - Form Fill
- **Status:** PASS
- **Details:** Credentials entered successfully
- **Screenshot:** `/Users/sour/Projects/cuts.ae/restaurant/test-screenshots/support-portal/login_page_filled_1763516051425.png`
- **Time:** 2025-11-19T01:34:11.466Z

#### [FAIL] Login Page - Authentication
- **Status:** FAIL
- **Details:** Login failed - still on login page
- **Screenshot:** `/Users/sour/Projects/cuts.ae/restaurant/test-screenshots/support-portal/login_page_after_submit_1763516083471.png`
- **Time:** 2025-11-19T01:34:43.519Z

### Dashboard

#### [FAIL] Dashboard - Access
- **Status:** FAIL
- **Details:** Could not access dashboard, still on login page
- **Screenshot:** `/Users/sour/Projects/cuts.ae/restaurant/test-screenshots/support-portal/dashboard_initial_1763516119552.png`
- **Time:** 2025-11-19T01:35:19.625Z

## Screenshots

Total screenshots captured: 4

1. **login_page_initial**
   - Path: `/Users/sour/Projects/cuts.ae/restaurant/test-screenshots/support-portal/login_page_initial_1763516049382.png`
   - Time: 2025-11-19T01:34:09.453Z

2. **login_page_filled**
   - Path: `/Users/sour/Projects/cuts.ae/restaurant/test-screenshots/support-portal/login_page_filled_1763516051425.png`
   - Time: 2025-11-19T01:34:11.466Z

3. **login_page_after_submit**
   - Path: `/Users/sour/Projects/cuts.ae/restaurant/test-screenshots/support-portal/login_page_after_submit_1763516083471.png`
   - Time: 2025-11-19T01:34:43.518Z

4. **dashboard_initial**
   - Path: `/Users/sour/Projects/cuts.ae/restaurant/test-screenshots/support-portal/dashboard_initial_1763516119552.png`
   - Time: 2025-11-19T01:35:19.625Z

## Recommendations

- Fix 2 failed test(s)
- Investigate and resolve 2 console error(s)
