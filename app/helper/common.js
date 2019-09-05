/* eslint-disable */
const fs = require('fs');
const hbs = require('hbs');
const crypto = require('crypto');
const base64 = require('base-64');
const utf8 = require('utf8');
const date_format = require('dateformat');

const partial_root_path = '/app/views/partials/';
const url_crypt = require('url-crypt')(
  '~{ry*I)==yU/]9<7DPk!Hj"R#:-/Z7(hTBnlRS=4CXF',
);
const {
  enums: { commitStatus, repositoryRoles, projectType },
} = require('./constants');

const base64Encode = text => {
  const bytes = utf8.encode(text);
  const encoded_text = base64.encode(bytes);
  return encoded_text;
};

const base64Decode = text => {
  const bytes = base64.decode(text);
  const decoded_text = utf8.decode(bytes);
  return decoded_text;
};
// Part of https://github.com/chris-rock/node-crypto-examples

const algorithm = 'aes-256-ctr';
const password = '@coolreviewpassword!';

const encrypt = text => {
  const cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

const decrypt = text => {
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

// Encrypt your data
const urlEncrypt = text => url_crypt.cryptObj(text);

const urlDecrypt = text => {
  try {
    return url_crypt.decryptObj(text);
  } catch (err) {
    err.message = `Failed to decrypt param '${text}'`;
    err.status = 404;
    throw err;
  }
};

const loadPartialView = (view_name, data) => {
  let content = '';
  if (data) {
    const source = fs.readFileSync(
      appPath + partial_root_path + view_name, // eslint-disable-line no-undef
      'utf8',
    );
    const template = hbs.compile(source);
    content = template(data);
  }
  return content;
};

const repositoryRolesList = () => {
  const repository_roles_list = [];
  Object.keys(repositoryRoles).forEach(key => {
    repository_roles_list.push({
      key,
      value: repositoryRoles[key],
    });
  });
  return repository_roles_list;
};

const getProjectsEmailDataQuery = user_id => `SELECT R.id, R.name as project_name, \'\' as project_link, 
	(SELECT COUNT(uuid) filter(WHERE status = ${commitStatus.Pending} and team_member_id <> ${user_id}  
	and repository_id = R.id) unreviewed_project_count FROM commits), TMR.permission 
	FROM repositories R 
	JOIN team_members_repositories as TMR ON TMR.repository_id = R.id 
	WHERE R.is_archived = false AND R.is_notifications_enabled = true AND TMR.team_member_id= ${user_id}`;

const getTeamRepositorysQuery = (
  organization_id,
  member_id,
) => `SELECT TMR.is_reviewer, TMR.repository_id, R.name AS repository_name, 
	TMR.permission, TMR.id 
	FROM team_members_repositories AS TMR 
	INNER JOIN repositories R ON R.id = TMR.repository_id AND R.is_archived = FALSE 
	WHERE R.organization_id = ${organization_id} AND TMR.team_member_id= ${member_id}
	ORDER BY R.name`;

const getCommitsReviewStatusQuery = () => {
  const now = new Date();
  return `SELECT r.id, r.name, r.channel_name,
	(SELECT COUNT(ch.commit_uuid) filter (WHERE ch.status in (${
    commitStatus.Accepted
  }, 
	${commitStatus.MarkAsFixed}) AND updated_at >= '${date_format(
    now,
    'mm/dd/yyyy',
  )}') reviewed_count 
	FROM commit_histories ch
	WHERE r.id = ch.repository_id ), 
	(SELECT COUNT(c.uuid) filter (WHERE c.status = ${
    commitStatus.Rejected
  }) rejected_count 
	FROM commits c 
	WHERE r.id = c.repository_id), 
	(SELECT COUNT(c.uuid) filter (WHERE c.status = ${
    commitStatus.Pending
  }) pending_count 
	FROM commits c
	WHERE r.id = c.repository_id), 
	(SELECT COUNT(c.uuid) today_commits_count 
	FROM commits c
	WHERE r.id = c.repository_id AND c.commit_date::date = now()::date) 
	FROM repositories r WHERE r.is_notifications_enabled = true and r.is_archived = false`;
};

const getQuery = (user_id, org_id, project_type) => {
  const org_filter =
    org_id > 0 ? `AND repositories.organization_id=${org_id}` : '';
  const qry_assigned_repos = `SELECT DISTINCT TRR.repository_id, null As encoded_repo_id, 
		null As encoded_name, name, is_forcefull_deployment_enabled, full_name, technology_id, 
		(SELECT COUNT(uuid) filter (WHERE status = ${commitStatus.Pending})reviewCount 
		FROM commits 
		WHERE TRR.repository_id = commits.repository_id),
		(SELECT COUNT(uuid) filter (WHERE status = ${commitStatus.Rejected})rejectedCount 
		FROM commits 
		WHERE TRR.repository_id= commits.repository_id),
        CASE WHEN team_members_repositories_states.is_current IS NULL THEN 'False' 
        ELSE team_members_repositories_states.is_current END,
        COALESCE(team_members_repositories_states.is_archived, false) as is_archived,
        COALESCE(team_members_repositories_states.is_favourite, false) as is_favourite,
        false as is_reviewer_repository_section, technologies.technology_name, technologies.icons
        FROM repositories
        LEFT JOIN  technologies on technologies.id = repositories.technology_id
        JOIN team_members_repositories TRR ON TRR.repository_id=repositories.id
		LEFT JOIN team_members_repositories_states 
		ON team_members_repositories_states.repository_id = repositories.id
        AND team_members_repositories_states.team_member_id = ${user_id}
        AND team_members_repositories_states.is_reviewer_repository_section = false
		WHERE repositories.is_archived = false AND repositories.is_active = true AND 
		TRR.team_member_id = ${user_id} and TRR.is_reviewer=false ${org_filter}`;

  const qry_reviewer_repos = `SELECT DISTINCT TRR.repository_id, null As encoded_repo_id, 
		null As encoded_name, name, is_forcefull_deployment_enabled,full_name, technology_id, 
		(SELECT COUNT(uuid) filter (WHERE status = ${commitStatus.Pending}) reviewCount 
		FROM commits 
		WHERE TRR.repository_id = commits.repository_id), 
		(SELECT COUNT(uuid) filter (WHERE status = ${commitStatus.Rejected}) rejectedCount 
		FROM commits 
		WHERE TRR.repository_id = commits.repository_id), 
        CASE WHEN team_members_repositories_states.is_current IS NULL THEN 'False' 
        ELSE team_members_repositories_states.is_current END, 
        COALESCE(team_members_repositories_states.is_archived, false) as is_archived, 
        COALESCE(team_members_repositories_states.is_favourite, false) as is_favourite, 
        true as is_reviewer_repository_section, technologies.technology_name, technologies.icons 
        FROM repositories
        LEFT JOIN  technologies ON technologies.id = repositories.technology_id
        JOIN team_members_repositories TRR ON TRR.repository_id = repositories.id
		LEFT JOIN  team_members_repositories_states 
		ON team_members_repositories_states.repository_id = repositories.id
        AND team_members_repositories_states.team_member_id = ${user_id}
        AND team_members_repositories_states.is_reviewer_repository_section = true
		WHERE repositories.is_archived = false AND repositories.is_active = true 
		AND TRR.team_member_id = ${user_id} ${org_filter}`;

  if (project_type === projectType.YourProjects) {
    return `${qry_assigned_repos} ORDER BY "reviewcount" DESC`;
  }
  return `${qry_reviewer_repos} ORDER BY "reviewcount" DESC`;
};

const getAchivedProjectQuery = (user_id, org_id) => {
  const org_filter =
    org_id > 0 ? `AND repositories.organization_id = ${org_id}` : '';

  const qry_assigned_repo = `(SELECT  TRR.repository_id, null As encoded_repo_id, null As encoded_name, 
		name, is_forcefull_deployment_enabled, technology_id, 
		(SELECT COUNT(uuid) filter (WHERE status = ${commitStatus.Pending}) reviewCount 
		FROM commits 
		WHERE TRR.repository_id = commits.repository_id), 
		(SELECT COUNT(uuid) filter (WHERE status = ${commitStatus.Rejected}) rejectedCount 
		FROM commits 
		WHERE TRR.repository_id = commits.repository_id), 
        CASE WHEN team_members_repositories_states.is_current IS NULL THEN 'False' 
        ELSE team_members_repositories_states.is_current END, 
        COALESCE(team_members_repositories_states.is_archived, false) as is_archived,
        COALESCE(repositories.is_archived, false) as admin_archived, 
        COALESCE(team_members_repositories_states.is_favourite, false) as is_favourite, 
        false as is_reviewer_repository_section, technologies.technology_name, technologies.icons 
        FROM repositories 
        LEFT JOIN technologies ON technologies.id = repositories.technology_id 
        JOIN team_members_repositories TRR ON TRR.repository_id = repositories.id 
		LEFT JOIN team_members_repositories_states 
		ON team_members_repositories_states.repository_id = repositories.id 
        ANS team_members_repositories_states.team_member_id = ${user_id} 
        AND team_members_repositories_states.is_reviewer_repository_section = false 
        WHERE (repositories.is_archived = true OR team_members_repositories_states.is_archived = true) 
        AND TRR.team_member_id = ${user_id} AND TRR.is_reviewer = false ${org_filter})`;
  return `${qry_assigned_repo} ORDER BY "rejectedcount" DESC`;
};

const updateReviewStatusQuery = time_interval => `UPDATE public.commits SET "status" = ${commitStatus.Rejected}, "is_system_rejected" = true, "updated_at" = now() 
	WHERE "status" = ${commitStatus.Pending} AND  commit_date < now() - interval '${time_interval}' hour`;

const getPendingReviewCommitsQuery = time_interval => `SELECT c.uuid as commit_id, c.message as commit_message, c.sha, c.short_sha, tm.name, 
	tm.email, r.name as repo_name,  r.full_name as repo_full_name, r.id as repo_id, r.channel_name, 
	r.is_notifications_enabled, r.is_archived 
	FROM public.commits c
    INNER JOIN public.team_members tm ON c.team_member_id = tm.id 
    INNER JOIN public.repositories r ON c.repository_id = r.id 
    WHERE "status" = ${commitStatus.Pending} 
    AND commit_date < now() - interval '${time_interval}' hour AND r.is_archived = false 
    ORDER BY r.name`;

const qryGetCommitCountMonthwise = repo_id => `SELECT to_char(date_trunc('month', created_at), 'MON-YYYY') AS "Month", 
	date_trunc('month', created_at) AS  "CommitDateTime", repository_id, 
    COUNT(CASE WHEN status = ${commitStatus.Accepted} THEN 1 ELSE NULL END) as Accepted, 
    COUNT(CASE WHEN status = ${commitStatus.Rejected} THEN 1 ELSE NULL END) as Rejected, 
    COUNT(CASE WHEN status = ${commitStatus.MarkAsFixed} THEN 1 ELSE NULL END) as MarkAsFixed 
    FROM public.commit_histories
    WHERE repository_id = ${repo_id} AND created_at > now() - interval '1 year' 
    GROUP BY "Month", "CommitDateTime", repository_id 
    ORDER BY "CommitDateTime"`;

const qryGetCommitCountByDate = (
  repo_id,
  current_date,
) => `SELECT "repositories"."id", "repositories"."name", "repositories"."channel_name", 
	(SELECT COUNT(commit_uuid) filter (WHERE status = ${commitStatus.Accepted} 
    AND to_char(updated_at, 'MM/DD/YYYY') = '${current_date}') "accepted_commits" 
	FROM "commit_histories" 
	WHERE "repositories"."id" = "commit_histories"."repository_id"), 
    (SELECT COUNT(commit_uuid) filter (WHERE status = ${commitStatus.MarkAsFixed} 
    AND to_char(updated_at, 'MM/DD/YYYY') = '${current_date}') "markAsFixed_commits" 
	FROM "commit_histories" 
	WHERE "repositories"."id" = "commit_histories"."repository_id"), 
    (SELECT COUNT(commit_uuid)  filter (WHERE status = ${commitStatus.Rejected} 
    AND to_char(updated_at, 'MM/DD/YYYY') = '${current_date}') "rejected_commits" 
	FROM "commit_histories" 
	WHERE "repositories"."id" = "commit_histories"."repository_id") 
    FROM "repositories" 
    WHERE "repositories"."id" = ${repo_id}`;

const qryCommitStats = repo_id => `SELECT "repositories"."id", 
	(SELECT COUNT(uuid) 
	FROM "commits" 
	WHERE "repositories"."id" = "commits"."repository_id" and status = ${commitStatus.Pending}) as commits_to_review, 
	(SELECT COUNT(commit_uuid) filter (WHERE status = ${commitStatus.Accepted}) "accepted_commits" 
	FROM "commit_histories" 
	WHERE "repositories"."id" = "commit_histories"."repository_id"), 
    (SELECT COUNT(commit_uuid) filter (WHERE status = ${commitStatus.MarkAsFixed}) "markAsFixed_commits" 
	FROM "commit_histories" 
	WHERE "repositories"."id" = "commit_histories"."repository_id"), 
    (SELECT COUNT(commit_uuid)  filter (WHERE status = ${commitStatus.Rejected}) "rejected_commits" 
	FROM "commit_histories" 
	WHERE "repositories"."id" = "commit_histories"."repository_id") 
    FROM "repositories" 
    WHERE "repositories"."id" = ${repo_id}`;

// Query to get rejected commits that were earlier accepted.
const qryRejectedCommitsByReviewerAndRepository = (
  reviewer_id,
  repo_id,
  where_condition,
) => `SELECT cm_2.id, c.message, c.short_sha, c.created_at, cm_2.commit_uuid, cm_2.repository_id, 
	repo.name as repo_name, commit_member.login as commit_by, commit_member.avatar_url as commit_avatar, 
	c.commit_date, accepted_member.login as accepted_by, rejected_member.login as Rejected_by 
    FROM public.commit_histories as cm_2 
    JOIN commit_histories as cm ON cm.commit_uuid = cm_2.commit_uuid AND cm.status = ${commitStatus.Rejected} 
    JOIN commits c ON c.uuid = cm.commit_uuid 
    JOIN team_members commit_member ON commit_member.id = c.team_member_id 
    JOIN team_members accepted_member ON accepted_member.id = cm_2.reviewer_id 
    JOIN team_members rejected_member ON rejected_member.id = cm.reviewer_id 
    JOIN repositories repo ON repo.id = c.repository_id 
	WHERE cm_2.reviewer_id = ${reviewer_id} AND cm_2.repository_id = ${repo_id} 
	AND cm_2.status = ${commitStatus.Accepted} ${where_condition} 
    ORDER BY cm_2.id DESC 
    LIMIT 20`;

const qryGetTeamMembersAssociatedToRepo = () => `SELECT t.id as team_member_id, t.login, t.name, t.email, tmr.id as team_members_repository_id, 
	tmr.repository_id, r.name as  repo_name, r.full_name as repo_full_name, r.channel_name, tmr.permission 
	FROM public.team_members t 
	LEFT OUTER JOIN public.team_members_repositories tmr ON t.id = tmr.team_member_id 
	AND tmr.permission in (${repositoryRoles.Developer}, ${repositoryRoles.Reviewer}) 
    INNER JOIN public.repositories r ON r.id = tmr.repository_id 
	WHERE r.is_archived = false AND r.is_email_notification_enabled = true 
	AND t.is_daily_email_enabled = true`;

const qryGetCommitCountByTeamMember = repo_id => `SELECT c.repository_id, tm.login, c.team_member_id, count(*) 
    FROM public.commits c 
    JOIN public.team_members tm ON c.team_member_id = tm.id 
    JOIN public.team_members_repositories tmr ON tmr.team_member_id = tm.id AND tmr.repository_id = ${repo_id} 
    WHERE c.repository_id = ${repo_id} AND c.team_member_id is not null 
    GROUP BY c.repository_id, tm.login, c.team_member_id`;

const qryGetReviewerStatus = (
  from_date,
  to_date,
  days_interval,
  team_member_id,
) => {
  let query = `SELECT tm.id, tm.name, tm.login, 
    (SELECT count(*) FROM commit_histories 
    WHERE status = ${commitStatus.Accepted} AND reviewer_id = tm.id AND created_at >= '${from_date}'::date 
    AND created_at <= ('${to_date}'::date + '${days_interval} day'::interval)) as accepted_count, 
	(SELECT count(*) FROM commit_histories 
	WHERE status = ${commitStatus.Rejected} AND reviewer_id = tm.id AND created_at >= '${from_date}'::date 
	AND created_at <= ('${to_date}'::date + '${days_interval} day'::interval)) as  rejected_count, 
	(SELECT count(*) FROM commit_histories 
	WHERE status = ${commitStatus.MarkAsFixed} AND reviewer_id = tm.id AND created_at >= '${from_date}'::date 
	AND created_at <= ('${to_date}'::date + '${days_interval} day'::interval)) as mark_as_fixed_count 
    FROM team_members tm`;
  if (team_member_id > 0) {
    query += ` WHERE tm.id = ${team_member_id}`;
  }

  query +=
    ' ORDER BY accepted_count desc, rejected_count desc, mark_as_fixed_count DESC';
  return query;
};

const qryGetCommitsPerWeek = repo_id => `SELECT count(*) as commits_count 
	FROM commits 
	WHERE commit_date > now() - interval '6 days' AND repository_id = ${repo_id}`;

const qryGetMembersCommitsStatsPerWeek = repo_id => `SELECT distinct t.id, t.login, t.name,
	(SELECT count(*) FROM commits c 
	WHERE c.team_member_id = t.id AND c.commit_date > now() - interval '6 days' 
	AND c.repository_id = ${repo_id}) as commits_by_dev,
	(SELECT count(*) FROM commit_histories ch 
	INNER JOIN commits c ON c.uuid = ch.commit_uuid 
	WHERE ch.reviewer_id = t.id AND c.commit_date > now() - interval '6 days') as commits_by_reviewer
	FROM team_members t
	INNER JOIN team_members_repositories tmr ON tmr.team_member_id = t.id
	INNER JOIN repositories r ON r.id = tmr.repository_id
	WHERE r.id = ${repo_id}`;

const qryGetRejectedResonCategories = () => `SELECT r.id, r.category, 
	array_to_string(array_agg(DISTINCT t.technology_name), ', ') as technologies
	FROM rejected_reason_categories r 
	LEFT JOIN tech_reason_categories c ON r.id = c.rejected_reason_category_id
	LEFT JOIN technologies t ON t.id = c.technology_id
	WHERE r.is_active = true
	GROUP BY r.id, r.category`;

const qryGetRejectedResonCategoriesById = id => `SELECT r.id, r.category,
	array_to_string(array_agg(DISTINCT t.id), ', ') as technologies
	FROM rejected_reason_categories r 
	LEFT JOIN tech_reason_categories c ON r.id = c.rejected_reason_category_id
	LEFT JOIN technologies t ON t.id = c.technology_id
	WHERE r.is_active = true AND r.id = ${id}
	GROUP BY r.id, r.category`;

const qryGetUnReviewedCommitsBeforeSpecifiedSHA = short_sha => `SELECT count(*) FROM commits 
	WHERE status in (${commitStatus.Pending}, ${commitStatus.Rejected}) 
	AND commit_date <= (SELECT commit_date FROM commits
	WHERE short_sha = '${short_sha}')
	AND repository_id = (SELECT repository_id FROM commits
	WHERE short_sha = '${short_sha}')`;

const qryGetDistinctCommitReasons = commit_uuid => `SELECT c."commit_uuid", c."rejected_reason_category_id", count("rejected_reason_id") AS "cnt", 
	r."description" AS "description", r."coding_guideline_link" AS "coding_guideline_link" 
	FROM "commit_rejected_reasons" c 
	LEFT OUTER JOIN "rejected_reasons" r ON c."rejected_reason_id" = r."id" 
	WHERE c."commit_uuid" = '${commit_uuid}' 
	GROUP BY c."commit_uuid", c."rejected_reason_category_id", c."rejected_reason_id", 
	"description", "coding_guideline_link"
	ORDER BY "description" asc`;
/* eslint-disable */

const sortArray = property => {
  let sort_order = 1;
  if (property[0] === '-') {
    sort_order = -1;
    property = property.substr(1);
  }
  return (a, b) => {
    const result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sort_order;
  };
};

const arrayGroupBy = (array, key) =>
  array.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});

const getMessage = (module, key) => {
  const data = fs.readFileSync('messages.json', 'utf8');
  obj = JSON.parse(data);
  let final_message = '';
  for (message of obj) {
    if (message[module][key]) {
      final_message = message[module][key];
    }
  }
  return final_message;
};

/**
 * Common method for all api response
 * @method apiResponse
 */
const apiResponse = (res, result, is_status, msg) => {
  res.json({
    status: is_status,
    data: result,
    message: msg,
  });
};

const exceptionHandler = fn => async (req, res, next) => {
  try {
    const { status, data } = await fn(req, res);
    res.status(status).send({
      success: true,
      status,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getResponse = fn => async (req, res, next) => {
  try {
    const { status, data } = await fn(req, res);
    res.status(status).send(data);
  } catch (error) {
    next(error);
  }
};

const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceAll = (target, search, replacement) =>
  target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);

module.exports = {
  base64Encode,
  base64Decode,
  encrypt,
  urlEncrypt,
  urlDecrypt,
  decrypt,
  getQuery,
  getProjectsEmailDataQuery,
  getCommitsReviewStatusQuery,
  updateReviewStatusQuery,
  qryGetCommitCountMonthwise,
  qryGetCommitCountByDate,
  getPendingReviewCommitsQuery,
  repositoryRolesList,
  qryRejectedCommitsByReviewerAndRepository,
  qryGetTeamMembersAssociatedToRepo,
  qryGetCommitCountByTeamMember,
  qryGetReviewerStatus,
  qryGetCommitsPerWeek,
  qryGetMembersCommitsStatsPerWeek,
  qryGetRejectedResonCategories,
  qryGetRejectedResonCategoriesById,
  qryCommitStats,
  qryGetUnReviewedCommitsBeforeSpecifiedSHA,
  qryGetDistinctCommitReasons,
  loadPartialView,
  sortArray,
  arrayGroupBy,
  getMessage,
  getTeamRepositorysQuery,
  getAchivedProjectQuery,
  apiResponse,
  exceptionHandler,
  getResponse,
  replaceAll,
};
