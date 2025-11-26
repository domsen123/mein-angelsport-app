# Rules for Shop System

We need to build a shop system where club members can buy permits. For himself or for the members he manages (e.g. parents for their children).


## Shop Entry Page
File: ./app/pages/verein/[slug]/index/shop/index.vue

- A user which is member of the club can buy permits
-- permits can be bought if the club.permitSaleStart >= today
-- a user can be do the purchase for himself and/or for the members he manages (managedBy)
-- a user can select the permits from the "current" period.. if there are options he can select one or the other (not both options of the same permit)

-- after he select the permits it should go to a page where he can see if he did all work duties... 
--- work duty events are defined with clubEvent.isWorkDuty... he should participated in the event with status "attended"
--- how much work duties a member needs to do is defined in club.workDutiesPerYear
--- if he did not do all work duties the price per work duty (club.workDutyPriceCents) is added to the total price with indicator (e.g. "3 missing work duties x 10€ = 30€")

-- after confirming the work duty page he should go to a overview page where the discounts get applied (each role can have discounts defined for permitOptions - highest discount wins if there are multiple)

## What we need here (logic)
- We need a way to store additonal "shop items" which are in fact not permits but other items (e. g. Aktiv Mitgliedschaft)...
- We need to mark some of the items which be added ALWAYS on a permit purchase (e.g. Aktiv Mitgliedschaft)
-- because the rule is... if a member buys an permit he automatically becomes an "active member" of the club otherwise at club.permitSaleEnd he becomes "passive member" again


## Sum Up
01. User goes to Shop Page where he can Select permits
02. Checks his Work duties... shows missing work duties and adds price if needed
03. Shows overview with discounts applied + "additonal items" 
04. go to "shipping details" (user needs to enter or confirm his address (clubMember table prefilled))
05. Overview of everythinig + "Order Now" button



