const date_format = require('dateformat');
const hbs = require('hbs');
const { loadPartialView } = require('../helper/common');
const {
  enums: { notificationType },
} = require('../helper/constants');

hbs.registerHelper('selected_if', (lvalue, rvalue, options) => {
  if (lvalue === rvalue) {
    return "selected='selected'";
  }
  return options.fn(this);
});

hbs.registerHelper('checked_if', (lvalue, options) => {
  if (lvalue === true) {
    return 'checked';
  }
  return options.fn(this);
});

hbs.registerHelper('comment_section', (comments, user, line) => {
  let content = '';
  if (comments && comments.length > 0) {
    content = loadPartialView('comments.hbs', {
      comments,
      user,
      line,
    });
  }
  return new hbs.SafeString(content);
});

hbs.registerHelper('comment_helper', string => new hbs.SafeString(string));


hbs.registerHelper('render_partial', (data, view_name) => {
  const content = loadPartialView(view_name, data);
  return new hbs.SafeString(content);
});

hbs.registerHelper('notification_message', data => {
  let output = '';
  if (data) {
    output =
      data.notification_type === notificationType.Rejected
        ? ' rejected the commit '
        : ' commented on commit ';
  }
  return new hbs.SafeString(output);
});

// common method for conditions to return true false results
hbs.registerHelper('ifvalue', (conditional, options) => {
  if (conditional === options.hash.equals) {
    return options.fn(this);
  }
  return options.inverse(this);
});

hbs.registerHelper('ifNotEqual', (conditional, options) => {
  if (conditional !== options.hash.equals) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// common method for conditions to return true false results
hbs.registerHelper('dateFormat', (date, format) => {
  if (date) {
    return new hbs.SafeString(date_format(new Date(date), format));
  }
  return new hbs.SafeString('');
});

hbs.registerHelper('team_member_projects', (data, user, view_name) => {
  let content = '';
  if (data) {
    content = loadPartialView(view_name, {
      repos: data,
      user,
    });
  }
  return new hbs.SafeString(content);
});

hbs.registerHelper(
  'heighlightedRowIfCommitRejected',
  (review_commit_count, rejected_commit_count, compare_data) => {
    let output = '';
    if (
      review_commit_count > compare_data ||
      rejected_commit_count > compare_data
    ) {
      output = ' style="background:#ff5937;"';
    }
    return new hbs.SafeString(output);
  },
);

hbs.registerHelper('teamDetail', (team, view_name) => {
  let content = '';
  if (team) {
    content = loadPartialView(view_name, {
      team,
    });
  }
  return new hbs.SafeString(content);
});
