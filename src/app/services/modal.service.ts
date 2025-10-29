import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

// Tipo do item para ações (delete, etc.)
export interface ModalActionItem {
  nid: number;
  name: string;
  type: 'consumable' | 'patrimony' | 'tag' | 'status' | 'unit' | 'qrcode';
}

// Dados do modal
export interface ModalData {
  modalType: 'confirmation' | 'info' | 'form'; // expandível
  title?: string;
  message?: string;
  item?: ModalActionItem;
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  // Estado inicial imutável
  private initialState: ModalData = {
    modalType: 'confirmation',
    show: false
  };

  private modalSubject = new BehaviorSubject<ModalData>(this.initialState);
  public modal$: Observable<ModalData> = this.modalSubject.asObservable();

  // Subject para confirmações
  private confirmSubject = new Subject<ModalActionItem>();
  public confirm$: Observable<ModalActionItem> = this.confirmSubject.asObservable();

  // Mostra modal de confirmação
  showConfirmation(
    title: string,
    message: string,
    item: ModalActionItem
  ): void {
    this.modalSubject.next({
      modalType: 'confirmation',
      title,
      message,
      item,
      show: true
    });
  }

  // Fecha modal
  hideModal(): void {
    this.modalSubject.next({ ...this.modalSubject.value, show: false });
  }

  // Confirma ação
  confirmAction(): void {
    const current = this.modalSubject.value;
    if (current.item) {
      this.confirmSubject.next(current.item);
    }
    this.hideModal();
  }

  // Escuta confirmações
  onConfirm(): Observable<ModalActionItem> {
    return this.confirm$;
  }
}