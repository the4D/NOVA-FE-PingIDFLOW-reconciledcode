import { QuestionComponent } from './questions/question/question.component';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { Observable, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApplicantService } from '@core/services/insurance/applicant.service';
import { ApplicationService } from '@core/services/insurance/application.service';
import { QuoteService } from '@core/services/insurance/quote.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { AutoWaiveQuestions, QuestionsComponent } from './questions/questions.component';
import { ApplicantQuote, IApplicantTab } from '@core/models/insurance/applicant-quote.model';
import {
  InsuranceTypeApplicantRequest,
  InsuranceTypeApplicationRequest,
  InsuranceTypeCoverageRequest,
  InsuranceTypeCoverageResponse,
  InsuranceTypeHealthQuestionRequest,
  QuoteInsuranceTypeRequest,
  QuoteInsuranceTypeResponse,
  quoteInsuranceTypeRequestInitialState,
} from '@core/models/insurance/quote-insurance-type.model';
import { HealthQuestionDto } from '@core/models/insurance/health-question.model';
import { HealthQuestionService } from '@core/services/insurance/health-question.service';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { AppState } from '@store';
import {
  insuranceApplicationApplicantFormGroupSelector,
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
  quoteInsuranceTypeResponseSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { Applicant } from '@core/models/insurance/applicant.model';
import { quoteInsuranceTypeApplication } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { Loan } from '@core/models/insurance/loan.model';
import { INSURANCE_TYPE, WORK_HOUR } from '@core/utils/enums/insurance-enums';
import { ApplicantCoverage } from '@core/models/insurance/coverage.model';
import { StepperMessageService } from '@core/services/insurance/stepper-message.service';
import { NoHealthQuestionsComponent } from './no-health-questions/no-health-questions.component';
import { AsyncPipe } from '@angular/common';
import { MessageType } from '@core/models/insurance/stepper-message.model';

@Component({
  selector: 'app-applicant-question',
  templateUrl: './applicant-question.component.html',
  styleUrls: ['./applicant-question.component.scss'],
  standalone: true,
  imports: [NoHealthQuestionsComponent, MatTabsModule, QuestionsComponent, AsyncPipe],
})
export class ApplicantQuestionComponent implements OnInit, AfterViewInit {
  @ViewChildren(QuestionsComponent) healthForms!: QueryList<QuestionsComponent>;
  @ViewChild(QuestionsComponent, { static: false }) healthFormComponent!: QuestionsComponent;
  @ViewChild('tabs') matTabGroup!: MatTabGroup;

  public stepper = input.required<MatStepper>();
  public stepList = input.required<any[]>();

  private store = inject(Store<AppState>);
  private cd = inject(ChangeDetectorRef);
  private stepService = inject(SharedStepService);
  private stepperMessage = inject(StepperMessageService);
  public quoteService = inject(QuoteService);
  public applicantService = inject(ApplicantService);
  public applicationService = inject(ApplicationService);
  public healthQuestionService = inject(HealthQuestionService);

  public isReadOnly: boolean = false;
  public tabList2: Array<IApplicantTab> = new Array<IApplicantTab>();
  public quoteList!: ApplicantQuote[];
  public title!: string;
  public nextTitle!: string;
  public previousTitle!: string;
  public description!: string;
  public nextButtonLabel: string = 'Additional Info';
  public allFormsValid: boolean = false;
  public showError: boolean = false;
  public isFormValid: boolean = true;
  public quoteResponse2!: QuoteInsuranceTypeResponse;
  public questionsAnswersList: AutoWaiveQuestions[] = [];
  public quoteInsuranceTypeResponseData$: Observable<QuoteInsuranceTypeResponse> = new Observable();
  public applicantList: Applicant[] = [];
  public previousButtonLabel!: string;
  public disabledButtonClick: boolean = false;

  constructor() {
    this.quoteInsuranceTypeResponseData$ = this.store.select(quoteInsuranceTypeResponseSelector);
  }

  ngOnInit(): void {
    // this.quoteResponse = quoteApplicationResponseInitialState();
    this.quoteInsuranceTypeResponseData$.subscribe((quoteResponse: QuoteInsuranceTypeResponse) => {
      this.populateApplicantList(quoteResponse);
      this.quoteResponse2 = quoteResponse;
      this.nextButtonLabel = this.getNextButtonLabel();
    });
    // this.quoteService.quoteApplicationResponse$
    //   .pipe(take(1))
    //   .subscribe((quoteResponse: QuoteApplicationResponse) => {
    //     this.quoteResponse = quoteResponse;
    //     this.nextButtonLabel = this.getNextButtonLabel();
    //   });

    this.title = this.stepList()[this.stepper().selectedIndex].title;
    this.nextTitle = this.stepList()[this.stepper().selectedIndex + 1].title;
    this.description = this.stepList()[this.stepper().selectedIndex].description;

    this.stepService.currentStateInfo.subscribe((step) => {
      if (step.currentStep === 4) {
        if (this.matTabGroup) {
          this.matTabGroup.selectedIndex = 0;
        }
      }
    });
  }

  private populateApplicantList(quoteResponse: QuoteInsuranceTypeResponse) {
    this.applicantList = [];
    quoteResponse.applications.forEach((application) =>
      application.applicants.forEach((applicant) => {
        this.applicantList.push(applicant);
      })
    );
  }

  ngAfterViewInit(): void {
    this.matTabGroup?.selectedIndexChange.subscribe((index) => {
      this.previousButtonLabel = '';
      if (index === this.applicantList.length - 1) {
        this.nextButtonLabel = this.nextTitle;
        this.previousButtonLabel = `: ${this.applicantList[index - 1]?.firstName} ${
          this.applicantList[index - 1]?.lastName
        }`;
      } else {
        this.nextButtonLabel = `${this.applicantList[index + 1]?.firstName} ${this.applicantList[index + 1]?.lastName}`;
        if (index > 0) {
          this.previousButtonLabel = `: ${this.applicantList[index - 1]?.firstName} ${
            this.applicantList[index - 1]?.lastName
          }`;
        }
      }
    });

    if (!this.noQuestions()) {
      this.nextButtonLabel =
        this.applicantList && this.applicantList.length > 1
          ? `${this.applicantList[1].firstName} ${this.applicantList[1].lastName}`
          : this.nextTitle;
      this.previousButtonLabel = '';
    } else {
      this.nextButtonLabel = this.nextTitle;
    }
    this.cd.detectChanges();
  }

  public onSetReadOnly = (isReadOnly: boolean) => {
    this.isReadOnly = isReadOnly;
  };

  public getNextButtonLabel = (): string => {
    let buttonLabel: string = this.nextTitle;
    if (this.matTabGroup && this.matTabGroup.selectedIndex !== null) {
      if (this.matTabGroup.selectedIndex + 1 === this.applicantList.length) {
        return this.stepList()[4].title;
      } else {
        return `${this.applicantList[this.matTabGroup.selectedIndex + 1]?.firstName} ${
          this.applicantList[this.matTabGroup.selectedIndex + 1]?.lastName
        }`;
      }
    }

    return buttonLabel;
  };

  public noQuestions(): boolean {
    let flag = true;
    // !Old Code
    // if (this.applicantList && this.applicantList.length > 0) {
    //   this.applicantList.forEach((applicant) => {
    //     if (applicant.questions.length > 0 && flag) {
    //       flag = false;
    //     }
    //   });
    // }

    this.quoteInsuranceTypeResponseData$.subscribe((quoteResponse) => {
      quoteResponse.applications.forEach((application) => {
        application.applicants
          .filter((applicant) => applicant.applicantCoverages && applicant.applicantCoverages.length > 0)
          ?.map((cover) => cover.applicantCoverages?.filter((value) => value.healthQuestionConfigurations.length > 0))
          ?.forEach((healthQ) => {
            if (healthQ && healthQ.length > 0) {
              flag = false;
            }
          });
      });
    });

    return flag;
  }

  private noQuestionsPerApplicant(applicantTab: number) {
    let flag = true;

    this.applicantList[applicantTab]?.applicantCoverages
      ?.filter((cover) => cover.healthQuestionConfigurations.length > 0)
      ?.forEach((coverQ) => {
        if (coverQ.healthQuestionConfigurations.length > 0) {
          flag = false;
        }
      });
    // this.quoteResponse.quotes[0]?.applicants[applicantTab]?.applicantCoverages
    //   ?.filter((cover) => cover.healthQuestionConfigurations.length > 0)
    //   ?.forEach((coverQ) => {
    //     if (coverQ.healthQuestionConfigurations.length > 0) {
    //       flag = false;
    //     }
    //   });

    return flag;
  }

  private allApplicants(applicationIndex: number = 0, answer: Applicant[]) {
    if (applicationIndex === 0 && answer === undefined) answer = [];

    this.quoteResponse2.applications[applicationIndex].applicants.forEach((applicant) => answer.push(applicant));

    if (applicationIndex + 1 !== this.quoteResponse2.applications.length) {
      this.allApplicants(applicationIndex + 1, answer);
    }
  }

  public onSelectedChange(event: any) {
    const applicants: Applicant[] = [];
    this.allApplicants(0, applicants);
    const applicant = this.quoteResponse2.applications.map((application) => application.applicants);

    if (
      applicants[event].applicantCoverages?.filter((coverage) => coverage.healthQuestionAnswers.length > 0).length === 0
    ) {
      this.isFormValid = true;
    } else {
      this.isFormValid = false;
    }
  }

  public clickNext() {
    if (this.noQuestions()) {
      this.next();
      return;
    }

    if (this.isReadOnly) {
      if (this.matTabGroup.selectedIndex != null) {
        if (this.matTabGroup.selectedIndex != this.applicantList.length - 1) {
          this.matTabGroup.selectedIndex = this.matTabGroup.selectedIndex + 1;
        } else {
          this.next();
          return;
        }
      }
    }

    this.checkAllFormsValid();

    let currentTab = this.matTabGroup.selectedIndex || 0;
    if (currentTab === this.applicantList.length - 1) {
      if (this.allFormsValid) {
        this.submit();
        return;
      }
      this.showErrors();
      return;
    }

    this.isFormValid = false;
    this.matTabGroup.selectedIndex = currentTab + 1;
  }

  public disabledButton() {
    const tempCurrentTab = this.matTabGroup === undefined ? 0 : this.matTabGroup.selectedIndex || 0;
    // when there are no questions for any of the applicants
    if (this.noQuestions()) {
      return false;
    }

    // When no questions only for current tab
    if (this.noQuestionsPerApplicant(tempCurrentTab)) {
      return false;
    }

    let validQuestions = true;
    this.healthForms?.get(tempCurrentTab)?.questionForm?.forEach((questionControl: QuestionComponent) => {
      if (!questionControl.questionForm.valid) {
        validQuestions = false;
        return;
      }
    });

    if (
      !validQuestions &&
      // !this.healthForms?.get(tempCurrentTab)?.questionsForm.valid &&
      !this.isReadOnly &&
      this.formQuestionsValid(tempCurrentTab) &&
      !this.stepService.currentStateValue.readOnlyBehavior
    ) {
      return true;
    }

    // When disclaimer is not checked
    let applicantSequence = this.applicantList[tempCurrentTab].applicantSequence;
    if (applicantSequence === undefined) applicantSequence = 0;
    const controlDisclaimer =
      this.healthForms?.get(tempCurrentTab)?.questionsForm?.controls[`disclaimer-${applicantSequence}`]?.value;
    if (!controlDisclaimer) {
      return true;
    }

    return false;
  }

  private formQuestionsValid(currentTab: number) {
    let flag: boolean = false;
    // const applicantType: string = this.quoteResponse.quotes[0].applicants[currentTab].applicantType;
    let applicantSequence: number | undefined = 0;
    if (
      this.applicantList[currentTab].applicantSequence &&
      this.applicantList[currentTab].applicantSequence !== undefined &&
      this.applicantList[currentTab].applicantSequence !== null
    )
      applicantSequence = this.applicantList[currentTab].applicantSequence
        ? this.applicantList[currentTab].applicantSequence
        : 0;
    if (applicantSequence === undefined) applicantSequence = 0;
    const controlDisclaimer =
      this.healthForms?.get(currentTab)?.questionsForm?.controls[`disclaimer-${applicantSequence}`]?.value;
    if (
      controlDisclaimer === undefined ||
      controlDisclaimer === '' ||
      controlDisclaimer === null ||
      !controlDisclaimer
    ) {
      return true;
    }

    if (this.quoteResponse2.insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
      this.healthForms?.get(currentTab)?.healthSPQuestions?.forEach((healthSpQuestion) => {
        healthSpQuestion.healthQuestionsDto.forEach((question: HealthQuestionDto) => {
          if (!flag) flag = this.validateControls(question, currentTab, applicantSequence ? applicantSequence : 0);
        });
      });
    } else {
      this.healthForms?.get(currentTab)?.healthQuestions?.forEach((question: HealthQuestionDto) => {
        if (!flag) flag = this.validateControls(question, currentTab, applicantSequence ? applicantSequence : 0);
      });
    }

    return flag;
  }

  private validateControls(question: HealthQuestionDto, currentTab: number, applicantSequence: number): boolean {
    let flag: boolean = false;
    const controlValue =
      this.healthForms?.get(currentTab)?.questionsForm?.controls[
        `question-${question.questionIdentifier}-${applicantSequence}`
      ]?.value;
    if (controlValue === undefined || controlValue === '' || controlValue === null) {
      flag = true;
    }

    return flag;
  }

  private reQuoteAgain(): boolean {
    let flag: boolean = false;
    const previouslyAnswered =
      this.questionsAnswersList.filter((answer) => answer.previouslyAnswered === true).length > 0;
    this.questionsAnswersList.forEach((answerList) =>
      answerList.questionsAnswers.forEach((answerQu) => {
        if (
          previouslyAnswered &&
          answerQu.autoWaive &&
          answerQu.answers.actual !== null &&
          answerQu.answers.previous !== answerQu.answers.actual
        ) {
          flag = true;
        }
      })
    );

    return flag;
  }

  private reQuote(): boolean {
    let flag: boolean = false;
    const previouslyAnswered =
      this.questionsAnswersList.filter((answer) => answer.previouslyAnswered === true).length > 0;
    this.questionsAnswersList.forEach((answerList) =>
      answerList.questionsAnswers.forEach((answerQu) => {
        if (!previouslyAnswered && answerQu.autoWaive && answerQu.answers.previous) {
          flag = true;
        }
      })
    );

    return flag;
  }

  private switchAnswers() {
    this.healthFormComponent.questionsAnswersList.forEach((byApplicant) => {
      byApplicant.questionsAnswers.forEach((answer) => {
        if (answer.answers.actual !== null) {
          answer.answers.previous = answer.answers.actual;
        } else {
          answer.answers.actual = answer.answers.previous;
        }
      });
    });
  }

  private getQuestionsIdentifiersByCoverageType = (
    applicantCoverages: ApplicantCoverage[] | undefined,
    coverageType: string
  ): string[] | undefined =>
    applicantCoverages
      ?.filter((coverage) => coverage.coverageType === coverageType)[0]
      .healthQuestionConfigurations.map((configQuestion) => configQuestion.healthQuestionIdentifier);

  private getHealthQuestionAnswers(
    applicant: Applicant,
    insuranceType: string,
    coverageType: string
  ): InsuranceTypeHealthQuestionRequest[] {
    const healthQuestionAnswered: InsuranceTypeHealthQuestionRequest[] = [];
    const configQuestions = this.getQuestionsIdentifiersByCoverageType(applicant.applicantCoverages, coverageType);

    this.healthForms.forEach((healthFormComponent: QuestionsComponent) => {
      if (insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
        healthFormComponent.healthSPQuestions
          .filter((question) => question.applicantSequence === applicant.applicantSequence)
          .forEach((question) =>
            question.healthQuestionsDto.forEach((questionDto: HealthQuestionDto) => {
              if (configQuestions && configQuestions.includes(questionDto.questionIdentifier)) {
                healthQuestionAnswered.push({
                  healthQuestionIdentifier: questionDto.questionIdentifier,
                  answer: questionDto.answer === true ? 'true' : 'false',
                });
              }
            })
          );
      } else {
        healthFormComponent.healthQuestions
          .filter(({ applicantSequence }) => applicantSequence === applicant.applicantSequence)
          .forEach((question: HealthQuestionDto) => {
            if (configQuestions && configQuestions.includes(question.questionIdentifier)) {
              question.autoWaive;
              if (
                healthQuestionAnswered.find((x) => x.healthQuestionIdentifier === question.questionIdentifier) ===
                undefined
              ) {
                healthQuestionAnswered.push({
                  healthQuestionIdentifier: question.questionIdentifier,
                  answer: question.answer === true ? 'true' : 'false',
                });
              }
            }
          });
      }
    });

    return healthQuestionAnswered;
  }

  private getCoveragesRequest(
    applicant: Applicant,
    coverages: InsuranceTypeCoverageResponse[] | undefined,
    insuranceType: string
  ): InsuranceTypeCoverageRequest[] {
    let coveragesRequest: InsuranceTypeCoverageRequest[] = [];

    applicant.applicantCoverages?.forEach((coverage: ApplicantCoverage) => {
      const healthQuestionAnswer = this.getHealthQuestionAnswers(applicant, insuranceType, coverage.coverageType);
      const percentage = coverages?.filter(({ coverageType }) => coverageType === coverage.coverageType)[0]
        .coveragePercent;

      let flag = false;
      if (healthQuestionAnswer.length > 0 && coverage.healthQuestionConfigurations.length > 0) {
        const config = coverage.healthQuestionConfigurations
          .filter((question) => question.autoWaive === true)
          .map((question) => question.healthQuestionIdentifier);
        const answers = healthQuestionAnswer
          .filter((answer) => answer.answer === 'true')
          .map((question) => question.healthQuestionIdentifier);

        answers.every((answer) => {
          if (config.includes(answer) && !flag) {
            flag = true;
            return false;
          }
          return true;
        });
      }

      let coverageCode = '';
      if (
        coverage.healthQuestionConfigurations.length > 0 &&
        flag &&
        coverage.healthQuestionConfigurations.filter((question) => question.autoWaive === true)[0].autoWaive
      ) {
        coverageCode = coverage.coverageCode.replace(coverage.coverageCode.substring(1, 3), '13');
      } else {
        coverageCode = coverage.coverageCode;
      }

      const coverageTemp: InsuranceTypeCoverageRequest = {
        coverageType: coverage.coverageType,
        coverageCode: coverageCode,
        coveragePercent: percentage ?? 100,
        healthQuestionAnswers: healthQuestionAnswer,
      };
      coveragesRequest.push(coverageTemp);
    });

    return coveragesRequest;
  }

  private getProvinceByApplicant(applicant: Applicant): string {
    let province: string | undefined = '';
    this.store
      .select(insuranceApplicationApplicantFormGroupSelector)
      .pipe(take(1))
      .subscribe((formGroups) => {
        province = formGroups.filter(
          (group) => group.personalInfoForm?.applicantIdentifier === applicant.applicantIdentifier
        )[0].addressForm?.province;
      });

    return province;
  }

  private getApplicationsRequest(): InsuranceTypeApplicationRequest[] {
    let insuranceTypeApplicationsRequest: InsuranceTypeApplicationRequest[] = [];

    this.quoteInsuranceTypeResponseData$.pipe(take(1)).subscribe((quoteResponse) => {
      quoteResponse.applications.forEach((application) => {
        if (application.id) {
          const applicationRequest: InsuranceTypeApplicationRequest = {
            id: application.id,
            loanAmountCovered: application.loanAmountCovered,
            loanPaymentAmountCovered: application.loanPaymentAmountCovered,
            amortization: application.amortization,
            applicants: application.applicants.map((applicant: Applicant) => {
              const coverages = this.getCoveragesRequest(applicant, application.coverages, quoteResponse.insuranceType);

              const applicantTemp: InsuranceTypeApplicantRequest = {
                applicantType: applicant.applicantType,
                birthDate: applicant.birthDate,
                isSmoker: applicant.isSmoker,
                selfEmployed: applicant.selfEmployed,
                workHours: applicant.workHours === 0 ? applicant.workHours : WORK_HOUR.MIN_WORK_HOURS_PER_WEEK,
                province: this.getProvinceByApplicant(applicant) ? this.getProvinceByApplicant(applicant) : '',
                coverages: coverages,
                gender: applicant.gender,
                applicantEmails: applicant.applicantEmails,
                applicantPhones: applicant.applicantPhones,
                applicantAddresses: applicant.applicantAddresses,
                applicantConsents: applicant.applicantConsents,
              };

              return applicantTemp;
            }),
          };

          insuranceTypeApplicationsRequest.push(applicationRequest);
        }
      });
    });

    return insuranceTypeApplicationsRequest;
  }

  private prepareQuoteRequest = (): QuoteInsuranceTypeRequest => {
    let quoteRequest: QuoteInsuranceTypeRequest = quoteInsuranceTypeRequestInitialState();

    this.store
      .select(insuranceApplicationLoanSelector)
      .pipe(take(1))
      .subscribe((loanInfo: Loan) => {
        quoteRequest = {
          loanId: this.quoteResponse2.loanId,
          loanType: loanInfo.loanType,
          insuranceType: loanInfo.insuranceType,
          paymentType: loanInfo.paymentType,
          fundingDate: loanInfo.fundingDate,
          firstPaymentDate: loanInfo.firstPaymentDate,
          loanAmount: loanInfo.loanAmount,
          paymentAmount: loanInfo.paymentAmount,
          monthlyPaymentAmount: loanInfo.monthlyPaymentAmount,
          paymentFrequency: loanInfo.paymentFrequency,
          interestRate: loanInfo.interestRate,
          loanTerm: loanInfo.loanTerm,
          amortization: loanInfo.amortization,
          applications: this.getApplicationsRequest(),
        };
      });

    return quoteRequest;
  };

  public submit() {
    if (this.stepService.currentStateValue.currentStep === 4 && this.stepService.currentStateValue.readOnlyBehavior) {
      this.next();
    } else {
      const quoteTypeRequest = this.prepareQuoteRequest();
      this.store.dispatch(setLoadingSpinner({ status: true }));
      this.store.dispatch(quoteInsuranceTypeApplication({ request: quoteTypeRequest }));

      this.store.select(loadingInformationSelector).subscribe((loading) => {
        if (!loading) {
          if (this.stepper().selectedIndex === 3) {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.next();
          }
        }
      });
    }
  }

  // private quoteBaseOnWaiveAnswers(): boolean {
  //   let flag: boolean = false;
  //   if (this.healthFormComponent.selectedInsuranceType !== 'SP') {
  //     this.healthForms.forEach((healthFormComponent: HealthFormComponent) => {
  //       healthFormComponent.healthQuestions.forEach((question) => {
  //         if (question.autoWaive && question.answer) {
  //           flag = true;
  //         }
  //       });
  //     })
  //   } else {
  //     this.healthForms.forEach((healthFormComponent: HealthFormComponent) => {
  //       healthFormComponent.healthSPQuestions.forEach((question: HealthQuestionsSpDto) => {
  //         question.healthQuestionsDto.forEach((eachQuestion) => {
  //           if (eachQuestion.autoWaive && eachQuestion.answer) {
  //             flag = true;
  //           }
  //         })
  //       });
  //     })
  //   }

  //   return flag;
  // }

  public next() {
    if (this.stepService.currentStateValue.currentStep === 4) {
      this.stepService.currentState = {
        ...this.stepService.currentStateValue,
        currentStep: 5,
      };
    }

    if (this.healthFormComponent !== undefined) {
      this.healthFormComponent.questionsAnswersList?.forEach((question) => (question.previouslyAnswered = true));
      this.switchAnswers();
    }
    // this.stepper().next();
    this.stepper().selectedIndex = 4;
  }

  public back() {
    this.questionsAnswersList = [];
    this.stepperMessage.messageContent = {
      message: '',
      type: MessageType.INFO,
      showIt: false,
    };
    if (
      this.matTabGroup !== undefined &&
      this.matTabGroup.selectedIndex &&
      this.matTabGroup.selectedIndex != null &&
      this.matTabGroup.selectedIndex != 0
    ) {
      this.matTabGroup.selectedIndex = this.matTabGroup.selectedIndex - 1;
    } else {
      this.stepService.currentState = {
        ...this.stepService.currentStateValue,
        currentStep: 3,
      };
      this.stepper().previous();
    }
  }

  private checkAllFormsValid() {
    let flag = true;
    this.healthForms.forEach((healthFormComponent: QuestionsComponent, index: number) => {
      if (flag && !this.stepService.currentStateValue.readOnlyBehavior) {
        flag = healthFormComponent.questionsForm.valid;
      }
    });
    this.allFormsValid = flag;
    this.showErrors();
  }

  private showErrors() {
    this.showError = true;
    this.healthForms.forEach((healthFormComponent: QuestionsComponent) => {
      //healthFormComponent.questionsForm.markAllAsTouched(); // check with Diego this check is not required
    });
  }

  public setFormValidation = (event: boolean) => {
    this.isFormValid = event;
  };
}
