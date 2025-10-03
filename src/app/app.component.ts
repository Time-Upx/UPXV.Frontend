import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ModalService, ModalData } from './services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'UPX_V';
  modalData: ModalData | null = null;
  private subscription: Subscription = new Subscription();

  constructor(public modalService: ModalService) { }

  ngOnInit() {
    // Escuta mudanças no modal para renderizar
    this.subscription.add(
      this.modalService.modal$.subscribe(data => {
        this.modalData = data;
      })
    );
  }

  handleConfirm() {
    this.modalService.confirmAction();
  }

  handleCancel() {
    this.modalService.hideModal();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}