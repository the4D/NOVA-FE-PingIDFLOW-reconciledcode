import { ILoan } from 'src/app/core/models/insurance/loan.model';

export const initialLoanState: ILoan = {
  id: '',
  applicationId: '',
  applicationIdentifier: '',
  insuranceType: '',
  loanType: '',
  fundingDate: '',
  firstPaymentDate: '',
  issueDate: '',
  effectiveDate: '',
  loanAmount: 0,
  paymentAmount: 0,
  insuredAmount: 0,
  monthlyPaymentAmount: 0,
  monthlyInsuredAmount: 0,
  totalPremiumWithTaxIncluded: 0,
  frequency: '',
  interestRate: 0,
  loanTerm: 0,
  amortization: 0,
  paymentType: '',
  insuranceTypeList: []
};

