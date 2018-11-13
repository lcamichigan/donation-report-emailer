function sendDonationReport() {
  // Replace this with the URL of a webhook that can respond by sending an
  // email, like a Zapier URL <https://zapier.com/help/webhooks/>.
  var url = 'https://';

  // Set up a currency formatter. It would be better to use Intl.NumberFormat
  // <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat>
  // like
  //   var currencyFormatter = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
  // However, Intl.NumberFormat is unavailable in Apps Script as of 30 Oct 2018,
  // so instead use Utilities.formatString
  // <https://developers.google.com/apps-script/reference/utilities/utilities#formatString(String,Object...)>.
  var currencyFormatter = {format: function(number) { return Utilities.formatString('$%.2f', number); }};

  // Define a class to manage creating a table of donations as both text and
  // HTML.
  function DonationTable(columnHeaders) {
    this.columnHeaders = columnHeaders;
    this.htmlCellStyle = 'padding:0.3em 0.4em';
    this.htmlRows = '';
    this.textRows = '';
    this.total = 0;
  }

  DonationTable.prototype.addRow = function(donation) {
    this.htmlRows += '<tr>';
    var textValues = [];
    ['dateString', 'donorName', 'donorClassYear', 'amount'].forEach(function(propertyName) {
      var propertyValue = donation[propertyName];
      var style = this.htmlCellStyle;
      if (propertyName === 'amount') {
        style += ';text-align:right';
        this.total += propertyValue;
        propertyValue = currencyFormatter.format(propertyValue);
      }
      this.htmlRows += '<td style="' + style + '">' + propertyValue + '</td>';
      textValues.push(propertyValue);
    }, this);
    this.htmlRows += '</tr>';
    this.textRows += textValues.join('\t') + '\n';
  };

  DonationTable.prototype.getHtml = function() {
    var html =
      '<table style="border-collapse:collapse">' +
        '<thead style="border-bottom-style:solid;border-bottom-width:1px">' +
          '<tr>';
    this.columnHeaders.forEach(function(columnHeader) {
      html += '<th style="' + this.htmlCellStyle + '">' + columnHeader + '</th>';
    }, this);
    return html +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          this.htmlRows +
        '</tbody>' +
      '</table>';
  };

  DonationTable.prototype.getText = function() {
    return this.columnHeaders.join('\t') + '\n' + this.textRows;
  };

  // Create dates to test whether donations were received between the start of
  // the previous and the start of the current month.
  var previousMonthStart = new Date();
  previousMonthStart.setDate(1);
  previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

  var currentMonthStart = new Date();
  currentMonthStart.setDate(1);

  // Map column names to indexes.
  var values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Donations').getDataRange().getValues();
  var columnIndexesForNames = {};
  values[0].forEach(function(name, index) {
    columnIndexesForNames[name] = index;
  });

  // Create the donation table.
  var donationTable = new DonationTable(['Date', 'Name', 'Class Year', 'Amount']);
  values.forEach(function(row) {
    var date = row[columnIndexesForNames['Date']];
    if (date instanceof Date && previousMonthStart <= date && date < currentMonthStart) {
      donationTable.addRow({
        dateString: Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM d'),
        donorName: row[columnIndexesForNames['Donor Name']],
        donorClassYear: row[columnIndexesForNames['Estimated Class Year']],
        amount: row[columnIndexesForNames['Amount']]
      });
    }
  });

  // Set up the email.
  var monthAndYear = Utilities.formatDate(previousMonthStart, Session.getScriptTimeZone(), 'MMM yyyy');

  var introduction = 'Sigma Alumni Association received ' + currencyFormatter.format(donationTable.total) + ' in donations in ' + monthAndYear + '.';
  var epilogue = 'This is an automatically generated email.';

  var htmlBodyComponents = ['<p>' + introduction + '</p>'];
  var textBodyComponents = [introduction + '\n'];
  if (donationTable.total > 0) {
    htmlBodyComponents.push(donationTable.getHtml());
    textBodyComponents.push(donationTable.getText());
  }
  htmlBodyComponents.push('<p>' + epilogue + '</p>');
  textBodyComponents.push(epilogue);

  // Post the email to a webhook URL using UrlFetchApp
  // <https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app#fetch(String,Object)>.
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      subject: 'Sigma Alumni Association ' + monthAndYear + ' donations',
      textBody: textBodyComponents.join('\n'),
      htmlBody: htmlBodyComponents.join('')
    })
  });
}
