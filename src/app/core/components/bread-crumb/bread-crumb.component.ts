import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, Observable, takeLast } from 'rxjs';
import { NgIf, AsyncPipe, TitleCasePipe } from '@angular/common';
import { BreadCrumbService } from '@core/services/bread-crumb/bread-crumb.service';

@Component({
  selector: 'bread-crumb',
  templateUrl: './bread-crumb.component.html',
  styleUrls: ['./bread-crumb.component.scss'],
  standalone: true,
  imports: [AsyncPipe, TitleCasePipe],
})
export class BreadCrumbComponent implements AfterViewInit {
  private router = inject(Router);
  private breadCrumb = inject(BreadCrumbService);

  public crumbObservable$: Observable<string>;

  constructor() {
    this.crumbObservable$ = this.breadCrumb.titleContent$;
  }

  ngAfterViewInit(): void {
    this.getTitle();
  }

  private getTitle() {
    let tittleFilled = false;
    this.router.events
      .pipe(
        filter((event) => {
          return event instanceof NavigationEnd;
        }),
        map(() => {
          let route: ActivatedRoute = this.router.routerState.root;
          let routeTitle = '';
          let parentRouteTitle = '';
          while (route!.firstChild) {
            route = route.firstChild;
          }
          if (route.snapshot.data['title']) {
            routeTitle = route!.snapshot.data['title'];
          }
          if (route!.parent) {
            let parentRoute: ActivatedRoute = route.parent;
            if (parentRoute.snapshot.data['title']) {
              parentRouteTitle = parentRoute!.snapshot.data['title'];
            }
          }
          return [routeTitle, parentRouteTitle];
        })
      )
      .subscribe((titles: string[]) => {
        tittleFilled = true;
        if (titles[0] !== '' && titles[0] !== 'New Policy') {
          this.breadCrumb.titleContent = titles[0];
        }

        if (this.router.url === '/new-policy') {
          this.breadCrumb.titleContent = '';
        }
      });

    setTimeout(() => {
      const some = this.router?.lastSuccessfulNavigation?.initialUrl?.root?.children['primary']?.segments;
      if (!tittleFilled && some !== undefined && some.length > 1) {
        this.breadCrumb.titleContent = `${some[0].path.replace('-', ' ')} - ${some[1].path.replace('-', ' ')}`;

        if (some.length > 2 && !parseInt(some[some.length - 1].path)) {
          this.breadCrumb.titleContent += ` - ${some[some.length - 1].path.replace('-', ' ').replace('-', ' ')}`;
        }
      }
    }, 300);
  }
}
