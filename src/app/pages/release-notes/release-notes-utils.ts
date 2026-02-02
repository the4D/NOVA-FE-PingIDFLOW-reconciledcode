export interface EachMonthData {
  header: string;
  overview: string;
  features: GeneralDataInfo[];
  applicationFormUpdate: GeneralDataInfo[];
  generalUsability: GeneralDataInfo[];
};

export interface GeneralDataInfo {
  index: number;
  description: string;
  nested?: GeneralDataInfo[];
};

export interface MonthData {
  value: string;
  monthDetail: EachMonthData[];
};

export interface YearData {
  value: string;
  month: MonthData[];
};

export interface ReleaseData {
  year: YearData[];
};

export const RELEASE_RAW_DATA: ReleaseData =
{
  year: [
    {
      value: '2025',
      month: [
         {
          value: 'Sept',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.9 - September 11, 2025',
              overview: 'Release addressing new features and general usability updates.',
              features: [
                { index: 1, description: 'Existing insurance cancellation option If applicants have existing insurance and they want to cancel it, they will have option to add that information with submission.' },
                { index: 2, description: 'Ability to download blank forms.' }
              ],
              applicationFormUpdate: [
                { index: 1, description: 'Supplemental form changes for standalone disability applications.' }
               
              ],
              generalUsability: [
                { index: 1, description: 'Flickering issue fix for 3 applicants. ' }
              ]
            }
          ]
        },
        {
          value: 'June',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.8 - June 11, 2025',
              overview: 'Release addressing general usability, new features & forms updates.',
              features: [
                { index: 1, description: 'Application Source field added to be part of the Insurance Application (Optional field).' }
              ],
              applicationFormUpdate: [
                { index: 1, description: 'PAD draw date should now populating on relevant forms.' },
                { index: 2, description: 'IUI insured amount will now populate correctly for all type of partial coverage' }
              ],
              generalUsability: [
                { index: 1, description: 'Removed Canadian format restriction on postal code field.' }
              ]
            }
          ]
        },
        {
          value: 'May',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.7 - May 7, 2025',
              overview: 'Release addressing general usability updates.',
              features: [
                { index: 1, description: 'Capping Monthly Payment amount for LOC \n 3% monthly payment amount for LOC is still in place, however since $6,000 is maximum coverage \n allowed, from now on it will be capped at $6,000 or 3% of loan amount (if it is less than $6,000).' }

              ],
              applicationFormUpdate: [
                { index: 1, description: 'None.' }
              ],
              generalUsability: [
                { index: 1, description: 'Correction for checkbox behavior on PAD for submitted application.' },
                { index: 2, description: 'Resolved focus mismatch on Step 3 P&C.' }
              ]
            }
          ]
        },
        {
          value: 'Mar',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.6 - March 19, 2025',
              overview: 'Release addressing features, form updates and usability issues.',
              features: [
                { index: 1, description: 'Allow for single applicant for multi applicant scenario.' },
                { index: 2, description: 'Adding "Back to LOS" button for MP Insurance.' }
              ],
              applicationFormUpdate: [
                { index: 1, description: 'Generate waiver form as expectations in SP when CI is ineligible due to age.' }
              ],
              generalUsability: [
                { index: 1, description: 'Application infrastructure upgrade.' },
                { index: 2, description: 'Form signing date label format change.' }
              ]
            }
          ]
        }
      ],
    },
    {
      value: '2024',
      month: [
        {
          value: 'Dec',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.5 - December 4, 2024',
              overview: 'Release addressing features, form updates and usability issues.',
              features: [
                { index: 1, description: 'Different partial coverage amounts for insurance coverages are enabled for each application associated with the loan.' }
              ],
              applicationFormUpdate: [
                { index: 1, description: 'Update to application form generation to improve compatibility with OneSpan sign.' }
              ],
              generalUsability: [
                { index: 1, description: 'Branch field remains populated when viewing Step 1 of a pending application.' }
              ]
            }
          ]
        },
        {
          value: 'Nov',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.4 - November 6, 2024',
              overview: 'Release addressing form updates, usability issues and new features.',
              features: [
                { index: 1, description: 'None.' }
              ],
              applicationFormUpdate: [
                { index: 1, description: 'Self Employed health questions will populate on form CP0301.' }
              ],
              generalUsability: [
                { index: 1, description: 'Place of birth is set to Yukon will no longer produce an error.' },
                {
                  index: 2, description: 'Closing the window will provide an updated status to the LOS.'
                }
              ]
            }
          ]
        },
        {
          value: 'Sep',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.3 - September 18, 2024',
              overview: 'Updates addressing form updates, usability issues and new features.',
              features: [
                { index: 1, description: 'Removal of CI health question forms from application process' }
              ],
              applicationFormUpdate: [
                { index: 1, description: 'Update to waiver form CP0228 to include applicant if Payment is more than $6000 ' },
                { index: 2, description: 'Inclusion of CI form CP0324 when user selects coverage' }
              ],
              generalUsability: [
                { index: 1, description: 'Update to container response to not include PAD information when applicant waives all coverage' },
                {
                  index: 2, description: 'Updates to Step-6:',
                  nested: [
                    { index: 1, description: 'Insured payment amount % field when Disability is waived' },
                    { index: 2, description: 'Insured payment amount is now set to zero when Disability and IUI coverage is waived' },
                    { index: 3, description: 'Line of Credit label update' },
                  ]
                }
              ]
            }
          ]
        },
        {
          value: 'Aug',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.2 - August 14, 2024',
              overview: 'Updates addressing form updates, usability issues and new feature supporting non-Canadian addresses.',
              features: [
                { index: 1, description: 'Addition of ‘Other’ for province and country option for non-Canadian addresses' }
              ],
              applicationFormUpdate: [
                { index: 1, description: 'Update to remove applicants (names and dates) that have waived all coverages from application forms' },
                { index: 2, description: 'Correction to the SP Monthly Benefit Amount on the CP0320 form' }
              ],
              generalUsability: [
                { index: 1, description: 'Updates to partial coverage to address values resetting when DI/CI already waived' },
                { index: 2, description: 'Increase of decimals to improve accuracy of partial coverage values' },
                { index: 3, description: 'Update to benefit amounts on Summary Screen to show correct values' },
                { index: 4, description: 'Colour changes to text and buttons' }
              ]
            }
          ]
        },
        {
          value: 'July',
          monthDetail: [
            {
              header: 'Securian Digital POS V1.1 - July 17, 2024',
              overview: 'General updates addressing form updates and usability issues.',
              features: [{ index: 1, description: 'None' }],
              applicationFormUpdate: [
                { index: 1, description: 'Removal of co-applicants that waive all coverages from critical illness forms' },
                { index: 2, description: 'Removal of applicant from waiver form CP0228 if applicant has taken all coverages' },
                { index: 3, description: 'Waiver form CP0228 now included in application when applicants are not eligible for CI or IUI' },
                { index: 4, description: 'Corrected LOC payment amount issue where input screen values differed from input screens and application forms' },
                { index: 5, description: 'Fixed issue of some users receiving validation error when downloading forms' },
                { index: 6, description: 'Updated application forms to be compatible with use with Onespan' },
                { index: 7, description: 'Corrections to incorrect minimum values appearing on the application forms CP0301 for Outstanding Balance Life application' },
                { index: 8, description: 'Update to display correct loan payment amounts for non-monthly payments on application forms CP0301' },
                { index: 9, description: 'Update for CI Form CP0219 to be included in application when CI coverage is taken but CI health questions are answered "Yes"' }
              ],
              generalUsability: [
                { index: 1, description: 'Updates to error messages for user clarity' },
                { index: 2, description: 'Removal of error on PAD screen when user has switched the order of the applicants' }
              ]
            }
          ]
        }
      ]
    }
  ],
};