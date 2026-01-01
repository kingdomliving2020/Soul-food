# Soul Food Testing - New Year's Launch Verification

## Test Scope
1. Homepage - New Year's badge displays correctly
2. Gaming Central modal - Youth/Adult selection works
3. Quick Order - Pre-Order button enables adding to cart
4. PDF Downloads - All uploaded files are accessible

## Test Credentials
- Beta user: `beta` / `Beta1!2!3!`
- Coupon: `Beta1!2!3!` (100% discount)

## Expected Results
- New Year message visible on homepage
- Gaming modal shows Youth Edition and Adult Edition buttons
- Pre-Order items can be added to cart
- Downloads return proper file sizes (4-7MB for hi-def PDFs)

## Notes for Testing Agent
- Focus on user flows, not deep API testing
- The cart should persist pre-order items
- Gaming edition buttons should navigate to `/gaming-central?edition=youth` or `/gaming-central?edition=adult`
