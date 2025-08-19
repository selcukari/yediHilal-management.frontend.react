import { clone, equals } from 'ramda';

export const isEquals = (value1: any, value2:any) => equals(clone(value1), clone(value2));
