import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ModalData {
  type: 'confirmation';
  title?: string;
  message?: string;
  item?: { nid: number; tid: string; type: string };
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new BehaviorSubject<ModalData>({ type: 'confirmation', show: false });
  public modal$: Observable<ModalData> = this.modalSubject.asObservable();

  // Subject para callbacks de confirmação (ex: delete)
  private confirmSubject = new Subject<{ nid: number; tid: string; type: string }>();

  // Mostrar modal de confirmação
  showConfirmation(title: string, message: string, item: { nid: number; tid: string; type: string }) {
    this.modalSubject.next({
      type: 'confirmation',
      title,
      message,
      item,
      show: true
    });
  }

  // Fechar modal
  hideModal() {
    this.modalSubject.next({ ...this.modalSubject.value, show: false });
  }

  // Confirmar ação - Emite via Subject e fecha
  confirmAction(): void {
    const current = this.modalSubject.value;
    if (current.item) {
      this.confirmSubject.next(current.item);
    }
    this.hideModal();
  }

  // Observable para quem quer escutar confirmações (ex: components)
  onConfirm(): Observable<{ nid: number; tid: string; type: string }> {
    return this.confirmSubject.asObservable();
  }
}