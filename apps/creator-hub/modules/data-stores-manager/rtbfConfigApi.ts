import {
  getConfigRepositoryValues,
  overwriteDraft,
  publishDraft,
} from '@modules/clients/creatorConfigsPublicApi';
import type { RtbfUserDataTemplate, RtbfTemplateRow } from './types';
import { RtbfConfigType, RTBF_REPOSITORY } from './types';

const DEFAULT_SCOPE = 'global';

function templateToRow(template: RtbfUserDataTemplate, index: number): RtbfTemplateRow | null {
  if (template.key_template) {
    const kt = template.key_template;
    return {
      id: `tmpl-${index}`,
      configType:
        kt.data_store_type === 'ORDERED' ? RtbfConfigType.OrderedKey : RtbfConfigType.StandardKey,
      dataStoreName: kt.data_store_name,
      keyPattern: kt.key_pattern,
      scopePattern: kt.scope_pattern ?? DEFAULT_SCOPE,
      dataStorePattern: '',
    };
  }

  if (!template.data_store_template) {
    return null;
  }

  return {
    id: `tmpl-${index}`,
    configType: RtbfConfigType.StandardDataStore,
    dataStoreName: '',
    keyPattern: '',
    scopePattern: '',
    dataStorePattern: template.data_store_template.data_store_pattern,
  };
}

function rowToTemplate(row: RtbfTemplateRow): RtbfUserDataTemplate {
  if (row.configType === RtbfConfigType.StandardDataStore) {
    return {
      data_store_template: {
        data_store_type: 'STANDARD',
        data_store_pattern: row.dataStorePattern,
      },
    };
  }

  return {
    key_template: {
      data_store_type: row.configType === RtbfConfigType.OrderedKey ? 'ORDERED' : 'STANDARD',
      data_store_name: row.dataStoreName,
      key_pattern: row.keyPattern,
      ...(row.scopePattern && row.scopePattern !== DEFAULT_SCOPE
        ? { scope_pattern: row.scopePattern }
        : {}),
    },
  };
}

export async function fetchRtbfConfig(universeId: string): Promise<RtbfTemplateRow[]> {
  const result = await getConfigRepositoryValues({
    universeId,
    repository: RTBF_REPOSITORY,
  });

  const raw = result.entries?.user_data_templates;
  if (!Array.isArray(raw)) {
    return [];
  }

  return (raw as RtbfUserDataTemplate[])
    .map(templateToRow)
    .filter((row): row is RtbfTemplateRow => row !== null);
}

export async function saveRtbfConfig(universeId: string, rows: RtbfTemplateRow[]): Promise<void> {
  const templates = rows.map(rowToTemplate);

  const draftResponse = await overwriteDraft(
    { universeId, repository: RTBF_REPOSITORY },
    { entries: { user_data_templates: templates } },
  );

  const { draftHash } = draftResponse;
  if (!draftHash) {
    throw new Error('Missing draftHash from overwriteDraft response');
  }

  await publishDraft(
    { universeId, repository: RTBF_REPOSITORY },
    {
      draftHash,
      message: 'Updated RTBF config via Creator Hub',
      deploymentStrategy: 'Immediate',
    },
  );
}
