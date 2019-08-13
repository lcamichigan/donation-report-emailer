# Donation Report Emailer

This is a [Google Apps Script](https://developers.google.com/apps-script/) for
sending a monthly report of donations to [Sigma Alumni
Association](https://lcamichigan.com).

The script is intended to be used in a spreadsheet
[named](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#getsheetbynamename)
“Donations” with columns named “Amount”, “Anonymous”, “Date”, “Donor Name”, and
“Estimated Class Year”. One way to use the script is to:

1. Open a Google sheet

2. Choose Tools > Script editor, paste
[sendDonationReport.gs](sendDonationReport.gs) into your project, and then
update the [URL](sendDonationReport.gs#L4) near the top of the script

3. Click the Triggers button (looks like a clock), and then add a
[trigger](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers)
to run the script on the first day of each month
