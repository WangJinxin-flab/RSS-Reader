export type RuleConditionType = 'title' | 'content' | 'author' | 'feed_id' | 'ai_prompt';
export type RuleOperator = 'contains' | 'not_contains' | 'equals' | 'ai_match';

export interface RuleCondition {
  type: RuleConditionType;
  operator: RuleOperator;
  value: string;
  aiProfileId?: string;
  tokenLimit?: number;
}

export interface RuleConditions {
  logic: 'and' | 'or';
  items: RuleCondition[];
  onlyUpdatedArticles?: boolean;
  includeFetchedArticles?: boolean;
}

export type RuleActionType = 'mark_read' | 'star' | 'add_tag' | 'add_group' | 'ai_score';

export interface RuleAction {
  type: RuleActionType;
  value?: string;
  aiProfileId?: string;
  prompt?: string;
  badgeName?: string;
  badgeColor?: string;
  badgeIcon?: string;
}

export interface Rule {
  id: string;
  name: string;
  isActive: boolean;
  conditions: string; // JSON string of RuleConditions
  actions: string; // JSON string of RuleAction[]
  sortOrder: number;
  createdAt: string;
}

export interface AiTask {
  id: string;
  articleId: number;
  ruleId: string;
  taskType?: 'condition' | 'action_score';
  actionConfig?: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  errorMsg?: string;
  createdAt: string;
}

export interface ArticleScore {
  id: number;
  articleId: number;
  ruleId: string;
  score: number;
  badgeName?: string;
  badgeColor?: string;
  badgeIcon?: string;
  reason: string;
  createdAt: string;
}
