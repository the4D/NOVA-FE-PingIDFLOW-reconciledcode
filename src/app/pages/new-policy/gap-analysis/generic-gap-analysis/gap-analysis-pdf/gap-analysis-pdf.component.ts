import { jsPDF } from 'jspdf';
import { Component, Input, OnInit, OnChanges, input } from '@angular/core';
import { UserService } from '../../../../../core/services/tenant/user.service';
import { User } from '../../../../../core/models/tenant/user.model';
import html2canvas from 'html2canvas';
import { BranchService } from '../../../../../core/services/tenant/branch.service';
import { NgIf, DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-gap-analysis-pdf',
  templateUrl: './gap-analysis-pdf.component.html',
  styleUrls: ['./gap-analysis-pdf.component.scss'],
  standalone: true,
  imports: [NgIf, DecimalPipe, CurrencyPipe, DatePipe],
})
export class GapAnalysisPdfComponent implements OnChanges {
  incomeInput = input<{ [key: string]: string } | undefined>();
  assets = input<{ [key: string]: string } | undefined>();
  liabilities = input<{ [key: string]: string } | undefined>();
  expenses = input<{ [key: string]: string } | undefined>();
  additionalExpenses = input<{ [key: string]: string } | undefined>();
  coverages = input<{ [key: string]: string } | undefined>();

  totalRequirement = input<number>(0);
  existingCoverage = input<number>(0);
  unprotectedCoverage = input<number>(0);

  monthlyObligation = input<number>(0);
  monthlyExistingCoverage = input<number>(0);
  monthlyGap = input<number>(0);

  totalCoverage = input<number>(0);
  totalExpenses = input<number>(0);
  totalAssets = input<number>(0);
  totalLiabilities = input<number>(0);
  monthlyIncome = input<number>(0);

  pdfLoan: any[] = [];
  pdfApplicant: any[] = [];
  date = new Date();
  portalUser: User | undefined;
  branchName: string | undefined;

  constructor(
    private userService: UserService,
    private branchService: BranchService
  ) {
    this.userService.user$.subscribe((user) => {
      this.portalUser = user;

      this.branchService.branches$.subscribe((branches) => {
        this.branchName = branches.find((b) => b.id == user.branchId)?.name;
      });
    });
  }
  ngOnChanges(): void {}

  public downloadPDF(): void {
    let page1: HTMLElement = document.getElementById('page1')!;
    let page2: HTMLElement = document.getElementById('page2')!;

    let canvas1 = html2canvas(page1, {
      onclone(document, element) {
        element.style.display = 'block';
        element.style.position = 'unset';
      },
    }) as Promise<HTMLCanvasElement>;

    let canvas2 = html2canvas(page2, {
      onclone(document, element) {
        element.style.display = 'block';
        element.style.position = 'unset';
      },
    }) as Promise<HTMLCanvasElement>;

    Promise.all([canvas1, canvas2]).then((values) => {
      let img1 = values[0].toDataURL('image/png');
      let img2 = values[1].toDataURL('image/png');

      let fileWidth = 450;
      let fileHeight = (values[0].height * fileWidth) / values[0].width;
      let PDF = new jsPDF('p', 'px', 'a4');

      PDF.addImage(img1, 'PNG', 0, 0, fileWidth, fileHeight);
      PDF.addPage();
      PDF.addImage(img2, 'PNG', 0, 0, fileWidth, fileHeight);

      PDF.save('GapAnalysis.pdf');
    });
  }
}
