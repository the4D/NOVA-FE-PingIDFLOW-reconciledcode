import { EntityMetadataMap, EntityDataModuleConfig } from '@ngrx/data';

const entityMetadata: EntityMetadataMap = {
  User: {
    entityName: 'User',
  },
};

const pluralNames = { User: 'User' };

export const entityConfig: EntityDataModuleConfig = {
  entityMetadata,
  pluralNames,
};
