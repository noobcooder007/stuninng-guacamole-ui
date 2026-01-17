import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor, MatButtonModule } from "@angular/material/button";
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'not-found',
    imports: [RouterLink, MatButtonModule, MatIconModule],
    templateUrl: './not-found.component.html',
    styleUrl: './not-found.component.scss',
})

export class NotFoundComponent {}
