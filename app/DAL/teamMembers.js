const { QueryTypes, Op } = require('sequelize');
const date_format = require('dateformat');
const { LINQ } = require('node-linq');
const time_ago = require('node-time-ago');

const model = require('../../models');
const {
  qryRejectedCommitsByReviewerAndRepository,
  urlEncrypt,
  qryGetTeamMembersAssociatedToRepo,
  qryGetReviewerStatus,
  exceptionHandler,
} = require('../helper/common');
const { getUserInfo, updateProfile } = require('../services/gitService');

exports.importUser = async team_member => {
  const [data, created] = await model.team_members.findOrCreate({
    where: { id: team_member.id },
    defaults: team_member,
  });

  if (created) return data;

  const item = {
    name: team_member.name,
    email: team_member.email,
    avatar_url: team_member.avatar_url,
  };
  return model.team_members.update(item, {
    where: { id: team_member.id },
  });
};

exports.getMembersEmails = async members_ids => {
  const team_members = await model.team_members.findAll({
    where: {
      id: {
        [Op.in]: members_ids,
      },
      email: {
        [Op.ne]: null,
      },
      is_commit_comment_email_enabled: true,
    },
    attributes: ['email'],
  });
  return team_members.map(async x => x.email);
};

exports.getAllTeamMembers = async () => {
  const team_members = await model.team_members.findAll({
    where: {
      is_active: true,
    },
    attributes: ['login'],
    order: [['id', 'ASC']],
  });
  return {
    data: team_members.filter(x => x.login != null).map(x => x.login),
  };
};

exports.getTeamMemberById = async id =>
  model.team_members.findOne({
    where: { id },
    attributes: [
      'id',
      'name',
      'login',
      'email',
      'avatar_url',
      'is_idle',
      'is_daily_email_enabled',
      'is_commit_comment_email_enabled',
      'is_web_notification_read',
    ],
  });

exports.getTeamMemberRejectedCommits = async (
  id,
  repository_id,
  last_commit_history_id,
) => {
  let no_records = false;
  const where_condition =
    last_commit_history_id === undefined
      ? ''
      : ` and cm_2.id < ${last_commit_history_id}`;
  const query = qryRejectedCommitsByReviewerAndRepository(
    id,
    repository_id,
    where_condition,
  );

  const [result] = await model.sequelize.query(query);
  if (result.length > 0) {
    last_commit_history_id = result[result.length - 1].id; // eslint-disable-line no-param-reassign
  } else {
    last_commit_history_id = ''; // eslint-disable-line no-param-reassign
    no_records = true;
  }

  const commits = new LINQ(result)
    .OrderByDescending(commit => commit.commit_date)
    .Select(commit => ({
      id: commit.id,
      repository_id: urlEncrypt(commit.repository_id),
      short_sha: commit.short_sha,
      repo_name: commit.repo_name,
      commit_avatar: commit.commit_avatar,
      message: commit.message,
      commit_by: commit.commit_by,
      accepted_by: commit.accepted_by,
      created_at: commit.created_at,
      commit_time: time_ago(new Date(commit.commit_date)),
      rejected_by: commit.rejected_by,
      commit_date: date_format(new Date(commit.commit_date), 'mediumDate'),
    }))
    .GroupBy(commit => commit.commit_date);

  const commit_list = [];
  Object.keys(commits).forEach(key => {
    const obj = {};
    obj.date = key;
    obj.commits_uuid = date_format(key, 'dd-mm-yyyy');
    obj.commits = commits[key];
    commit_list.push(obj);
  });

  return {
    commit_list,
    last_commit_history_id,
    no_records,
  };
};

exports.getTeamMembersAssociatedRepo = async () => {
  const qry_get_team_members_associted_repo = qryGetTeamMembersAssociatedToRepo();
  return model.sequelize.query(qry_get_team_members_associted_repo);
};

const updateMemberDetails = async (
  email,
  name,
  login,
  is_daily_email_enabled,
  is_commit_comment_email_enabled,
  user,
) => {
  await model.team_members.update(
    {
      email,
      name,
      is_daily_email_enabled,
      is_commit_comment_email_enabled,
    },
    {
      where: { login },
    },
  );
  user.email = email; // eslint-disable-line no-param-reassign
  user.name = name; // eslint-disable-line no-param-reassign
  return {
    status: 200,
    data: {
      success: true,
      message: `${login} details updated.`,
    },
  };
};

exports.updateTeamMemberdetails = exceptionHandler(
  async ({
    body: {
      verify_email,
      login,
      email,
      name,
      is_daily_email_enabled,
      is_commit_comment_email_enabled,
    },
    session: { user },
  }) => {
    if (verify_email === 'true') {
      const user_info = await getUserInfo(
        process.env.GITHUB_API_ACCESS_TOKEN,
        login,
      );
      if (user_info) {
        if (!user_info.email) {
          return {
            status: 200,
            data: {
              success: false,
              privacy: 'private',
              message: `${login} email address not found, please make it public.`,
            },
          };
        }
        if (user_info.email !== email) {
          return {
            status: 200,
            data: {
              success: false,
              message: `${login} email address must be same as used in github.`,
            },
          };
        }
        await updateProfile(name, user.token);
        return updateMemberDetails(
          email,
          name,
          login,
          is_daily_email_enabled,
          is_commit_comment_email_enabled,
          user,
        );
      }
    } else {
      return updateMemberDetails(
        email,
        name,
        login,
        is_daily_email_enabled,
        is_commit_comment_email_enabled,
        user,
      );
    }
    return {
      status: 404,
      data: {
        success: false,
        privacy: 'private',
        message: 'user not found',
      },
    };
  },
);

exports.getTeamMembersList = async () =>
  model.team_members.findAll({
    where: {
      is_active: true,
    },
    attributes: [
      'id',
      'login',
      'avatar_url',
      'name',
      'email',
      'is_idle',
      'is_active',
    ],
    order: [['login', 'ASC']],
  });

exports.updateTeamMember = async (body, id) => {
  let where_condition = {};
  if (id > 0) {
    where_condition = {
      where: { id },
    };
  }
  return model.team_members.update(body, where_condition);
};

exports.getReviewerCommitsCounts = async (
  from_date,
  to_date,
  days_interval,
  team_member_id,
) => {
  const qry_get_reviewer_status = qryGetReviewerStatus(
    from_date,
    to_date,
    days_interval,
    team_member_id,
  );
  return model.sequelize.query(qry_get_reviewer_status, {
    type: QueryTypes.SELECT,
  });
};
