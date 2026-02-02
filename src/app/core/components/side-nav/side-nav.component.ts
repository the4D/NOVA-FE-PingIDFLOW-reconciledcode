import { Component, inject, input, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

class NavigationElement {
  constructor(
    public parentRouteLink: string,
    public label: string,
    public icon: string,
    public routeLink: string,
    public hasChildren: boolean,
    public hasParentExpanded: boolean,
    public selected: boolean
  ) { }
}

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  standalone: true,
  imports: [NgClass, RouterLink, MatIconModule],
})
export class SideNavComponent implements OnInit {
  navExpanded = input<boolean>(false);
  admin = input<boolean>(false);

  private router = inject(Router);

  private navRedirectedLink: string = '';

  navElements: NavigationElement[] = [
    new NavigationElement('', 'New Policy', 'add_box', '/new-policy', true, false, true),
    new NavigationElement('/new-policy', 'Gap Analysis', '', '/gap-analysis', false, false, false),
    new NavigationElement('/new-policy', 'Quick Quote', '', '/quick-quote', false, false, false),
    new NavigationElement('/new-policy', 'Insurance Application', '', '/insurance-application', false, false, false),
    new NavigationElement('', 'Reports', 'description', '/reports', false, false, false),
    new NavigationElement('', 'Release notes', 'edit_note', '/release-notes', false, false, false),
    new NavigationElement('', 'Forms', 'content_copy', '/forms', false, false, false)
  ];
  ngOnInit() {
    // Role-based logic removed - handled by guards


    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        let navSelected: NavigationElement | undefined = this.navElements.find(
          (p) => p.parentRouteLink != '' && event.url.includes(p.parentRouteLink + p.routeLink)
        );
        if (navSelected === undefined) {
          navSelected = this.navElements.find((p) => event.url.includes(p.parentRouteLink + p.routeLink));
        }

        if (navSelected?.parentRouteLink && navSelected?.routeLink) {
          this.navRedirectedLink = navSelected!.parentRouteLink + navSelected!.routeLink;
          this.highlightNavElement(this.navRedirectedLink);
        }
      }
    });
  }

  private highlightNavElement(url: string) {
    this.navElements.forEach((f) => (f.selected = false));
    this.navElements.filter((p) => p.parentRouteLink + p.routeLink == url)[0].selected = true;
  }

  toggleSubNavBar(url: string) {
    this.navElements.filter((p) => p.parentRouteLink + p.routeLink == url)[0].hasParentExpanded =
      !this.navElements.filter((p) => p.parentRouteLink + p.routeLink == url)[0].hasParentExpanded;
  }

  listNavElements(parentRouteLink: string) {
    return this.navElements.filter((p) => p.parentRouteLink == parentRouteLink);
  }
}
