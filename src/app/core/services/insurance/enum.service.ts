import { Injectable } from '@angular/core';
import { EnumValue } from '@core/models/insurance/enum.model';

@Injectable({
  providedIn: 'root',
})
export class EnumService {
  public getId = (enumValues: EnumValue[], abbreviation?: string): number => {
    return enumValues.find((ev) => ev.abbreviation == abbreviation)?.id || 0;
  };

  public getAbbreviation = (enumValues: EnumValue[], id?: number | string): string => {
    return enumValues.find((ev) => ev.id.toString() == id?.toString())?.abbreviation || 'No Type';
  };

  public getAbbreviationBySystemValue = (enumValues: EnumValue[], systemValue?: string): string => {
    return enumValues.find((ev) => ev.systemValue === systemValue)?.abbreviation || 'No Type';
  };
   public getAbbreviationByDescription = (enumValues: EnumValue[], description?: string): string => {
    return enumValues.find((ev) => ev.description == description)?.abbreviation || 'No Type';
  };

  public getDescription = (enumValues: EnumValue[], abbreviation?: string): string => {
    return enumValues.find((ev) => ev.abbreviation == abbreviation)?.description || 'No Type';
  };

  public getSystemValue = (enumValues: EnumValue[], abbreviation?: string): string => {
    return enumValues.find((ev) => ev.abbreviation == abbreviation)?.systemValue || 'No Type';
  };

  public getSequence = (enumValues: EnumValue[], abbreviation?: string): number => {
    return enumValues.find((ev) => ev.abbreviation == abbreviation)?.sequence || 0;
  };
}
