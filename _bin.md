2. Permit Instance Status Mismatch

  - Line 88: Says status has values available, reserved, cancelled
  - Line 302: Says we update to sold
  - Question: Is there a sold status or should it be something else? Need to clarify what happens
  to permit instance after successful order.

  3. Address fields incomplete

  - Line 56 (club_orders): shippingAddress has { street, zip, city, country }
  - Question: Should we also store firstName, lastName? Or is that always derived from the member?

  4. Missing: What if managed member has no address? (Line 281)

  - Currently says "might need to use buyer's address or require input"
  - Question: Should we enforce that the address comes from the recipient member (since we want
  their address for invoices), or fall back to buyer?

  5. Club fields referenced but not documented

  These club fields are referenced but not listed - need to confirm they exist:
  - club.permitSaleStart
  - club.permitSaleEnd
  - club.workDutiesPerYear
  - club.workDutyPriceCents

  6. Missing: Cancel/Back behavior

  - What happens if user clicks "Back" during checkout?
  - What happens if user closes browser/tab? (Reservation expires naturally, but should we show a
  warning?)

  7. Missing API for discounts

  - Step 3 needs discount data, but there's no explicit API call listed for fetching discounts
  - Should this be included in the /shop/permits response, or separate endpoint?

  8. Success page order details

  - After order is placed, how does user access their order later?
  - Should there be a "My Orders" page for members? Or only admin can see orders?


  2. check @server/database/schema/permit.schema.ts for enums
  3. derived from the member
  4. if member has no address, prefill is empty and user must enter address manually (address always required)
  5. check @server/database/schema/club.schema.ts
  6. What happens if user clicks "Back" during checkout? -> since every step is separate page, going back just goes to previous step/page.. if we leave the checkout flow, reservation gets cancelled after reservedAt + 5 minutes
     What happens if user closes browser/tab? (Reservation expires naturally, but should we show a warning?) -> no warning, reservation expires after timer
  7. developer decides through development how he want to handle this
  8. My orders page currently out of scope... but in fact for each member with an order in the current year there should be a notification that the order is already done... for future maybe with link to "my orders" page