import { AfterViewInit, Component, EventEmitter, input, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatOptionSelectionChange, MatOptionModule } from '@angular/material/core';
import { MatStepper } from '@angular/material/stepper';
import { Observable, Subscription, delay, distinctUntilChanged, map, startWith, take } from 'rxjs';
import { Branch, Phone } from 'src/app/core/models/tenant/branch.model';
import { UserResourceParams, User, User2 } from 'src/app/core/models/tenant/user.model';
import { BranchService } from 'src/app/core/services/tenant/branch.service';
import { UserService } from 'src/app/core/services/tenant/user.service';
import { NgxMaskModule } from 'ngx-mask';
import { MatSelectModule } from '@angular/material/select';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'lender-info',
  templateUrl: './lender-info.component.html',
  styleUrls: ['./lender-info.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    NgxMaskModule,
    AsyncPipe,
  ],
})
export class LenderInfoComponent implements OnInit, OnDestroy, AfterViewInit {
  public stepper = input<MatStepper>();
  public branchCode = input<string>();
  public userBranch = input<User2>();
  public extraInfo = input<boolean>();
  @Output() public lenderFormInfoEvent: EventEmitter<UntypedFormGroup> = new EventEmitter<UntypedFormGroup>();
  @Output() public isFormValidEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  private userList: User[] = [];
  public branchList!: Branch[];
  private lenderId: string | undefined;
  public isReadOnly: boolean = false;
  public counter: number = 0;
  private subscription$ = new Subscription();
  public filteredUserList$!: Observable<User[]>;
  private user!: User2;

  public lenderForm = this.fb.group({
    lender: [null, [Validators.required]],
    branch: [null, [Validators.required]],
    userEmail: this.extraInfo() ? [null, [Validators.required]] : null,
    phoneNumber: this.extraInfo() ? [null, [Validators.required]] : null,
  });

  constructor(
    private fb: UntypedFormBuilder,
    private userService: UserService,
    private branchService: BranchService
  ) {}

  ngAfterViewInit(): void {
    if (this.lenderForm.status === 'VALID') {
      this.isFormValidEvent.emit(true);
    } else if (this.lenderForm.status === 'INVALID') {
      this.isFormValidEvent.emit(false);
    }
  }

  ngOnInit() {
    this.branchService.branches$.subscribe((branches: Branch[]) => {
      if (branches.length > 0 && (this.branchList === undefined || this.branchList.length === 0)) {
        this.branchList = branches;
        this.setLenderForm(this.branchCode(), this.userBranch());
        this.lenderFormInfoEvent.emit(this.lenderForm.getRawValue());
      }
    });
    this.branchList = this.branchService.branchesValue;
    this.userNotFoundValidator(this.lenderForm.controls['lender']);
    this.formValidation();
  }

  public formValidation() {
    this.lenderForm.statusChanges.subscribe((status) => {
      if (status === 'INVALID') {
        this.isFormValidEvent.emit(false);
      } else if (status === 'VALID') {
        this.isFormValidEvent.emit(true);
      }
    });

    this.lenderForm.valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      this.lenderFormInfoEvent.emit(this.lenderForm.getRawValue());
    });
  }

  ngOnDestroy(): void {
    if (this.subscription$) this.subscription$.unsubscribe();
  }

  userNotFoundValidator = (control: AbstractControl) => {
    const name = control.value;
    if (name) {
      const fullName = name.firstName + ' ' + name.lastName;
      if (!name.firstName) {
        if (this.userList.length > 0) {
          const found = this.userList.some(
            (user) => (user.firstName + ' ' + user.lastName).toLowerCase() == name.toLowerCase()
          );
          if (!found) {
            return { userNotfound: true };
          }
        }
      } else {
        if (this.userList.length > 0) {
          const found = this.userList.some((user) => (user ? user.id : ' '));
          if (!found) {
            return { userNotfound: true };
          }
        }
      }
    } else {
      return { userNotfound: true };
    }
    return null;
  };

  public lenderFn = () => {
    if (!this.isReadOnly) {
      this.counter = this.counter + 1;
      if (
        this.lenderForm.controls['lender'].value &&
        this.lenderForm.controls['lender'].value.length > 2 &&
        this.counter > 1
      ) {
        let searchOptions: UserResourceParams = {
          orderBy: 'CreatedOn desc',
        };
        let filterValue = this.lenderForm.controls['lender'].value;
        searchOptions.name = filterValue;
        if (this.stepper()?.selectedIndex === 0) {
          this.subscription$ = this.userService
            .getUsersByCriteria(searchOptions)
            .pipe(take(1))
            .subscribe((userList) => {
              this.userList = userList.value.sort((a, b) => {
                if (a.firstName < b.firstName) return -1;
                if (a.firstName > b.firstName) return 1;
                return 0;
              });
              this.filteredUserList$ = this.lenderForm.controls['lender'].valueChanges.pipe(
                startWith(''),
                map((value) => (typeof value === 'string' ? value : value.firstName)),
                map((name) => (name ? this.filterUser(name) : this.userList.slice()))
              );
            });
        }
      }
    }
    let values = this.lenderForm.value;
    this.lenderId = values.lender?.id ? values.lender?.id : this.lenderId;
  };

  public userSelected(event: MatOptionSelectionChange) {
    this.user = event.source.value as User2;
    this.lenderId = event.source.value.id;
  }

  private filterUser = (value: string): User[] => {
    const filterValue = value.toLowerCase();
    return this.userList.filter((user) => (user.firstName + ' ' + user.lastName).toLowerCase().includes(filterValue));
  };

  public displayFn(user: User | string): string {
    if (typeof user === 'string') {
      return user;
    }
    this.lenderId = user ? user.id : this.lenderId;
    this.counter = 0;
    return user && user.firstName ? `${user.firstName} ${user.lastName}` : '';
  }

  public setLenderForm(branchCode: string | undefined, user: User2 | undefined) {
    if (user === undefined || user.id === '') {
      this.userService.user$.subscribe((user: User) => {
        this.user = {
          id: user.id ? user.id : '',
          tenantId: user.tenantId ? user.tenantId : '',
          branchId: user.branchId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          employeeId: user.employeeId,
          role: user.role,
        };
        this.lenderForm.get('lender')?.setValue(`${user.firstName} ${user.lastName}`);
        if (this.extraInfo()) {
          this.lenderForm.get('userEmail')?.setValue(`${user.email}`);
          const userPhone = this.branchList
            .filter((branch: Branch) => branch.tenantId === this.user.tenantId)[0]
            ?.phones.filter((phone: Phone) => phone.isPrimary)[0].number;
          this.lenderForm.get('phoneNumber')?.setValue(`${userPhone}`);
        }
        if (branchCode === '' || branchCode === undefined) {
          this.lenderForm.get('branch')?.setValue(user.branchId);
        }
      });
    } else {
      this.lenderForm.get('lender')?.setValue(`${user.firstName} ${user.lastName}`);
      this.user = user;
      this.lenderForm.get('branch')?.setValue(user.branchId);
    }
    if (branchCode !== '' && branchCode !== undefined) {
      this.setBranchByCode(branchCode);
    }
  }

  private setBranchByCode(branchCode: string | undefined) {
    const branchId = this.branchList.filter((branch) => branch.code === branchCode)[0]?.id;
    this.lenderForm.get('branch')?.setValue(branchId);
    // setTimeout(() => {
    //   this.store.dispatch(setLoadingSpinner({ status: false }));
    // }, 1700);
  }

  public lenderFormInfoValues() {
    this.lenderFormInfoEvent.emit(this.lenderForm);
  }
}
