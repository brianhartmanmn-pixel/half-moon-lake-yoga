import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getFirestore, doc, addDoc, updateDoc, deleteDoc, collection, Timestamp, serverTimestamp } from 'firebase/firestore';

// Re-declare interfaces/types required by this component
export interface YogaClass {
  id: string;
  attendees: string[];
  date: any;
  isCanceled: boolean;
  location: string;
}
// declare const __app_id: string; // REMOVED
// __firebase_config removed


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  @Input() classes: YogaClass[] = [];
  @Output() classActionComplete = new EventEmitter<void>();

  // Form state
  newClassDate: string = '';
  newClassLocation: string = '';
  isProcessing: boolean = false;
  message: string | null = null;
  messageType: 'success' | 'error' = 'success';

  // Initialize DB instance (assuming app is already initialized in root)
  private db: any = getFirestore();

  formatDateTime(timestamp: any): string {
    return timestamp.toDate().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }

  async addNewClass() {
    if (!this.newClassDate || !this.newClassLocation) return;

    this.isProcessing = true;
    this.message = null;

    try {
      const classTimestamp = Timestamp.fromDate(new Date(this.newClassDate));
      // FIX: Using the correct 'classes' collection path
      const classesCollectionPath = `classes`;
      const classesCollection = collection(this.db, classesCollectionPath);

      await addDoc(classesCollection, {
        attendees: [],
        date: classTimestamp,
        isCanceled: false,
        location: this.newClassLocation.trim(),
        createdAt: serverTimestamp()
      });

      this.messageType = 'success';
      this.message = `New class scheduled successfully at ${this.newClassLocation}.`;
      this.newClassDate = '';
      this.newClassLocation = '';
      this.classActionComplete.emit();

    } catch (error) {
      console.error('Error adding class:', error);
      this.messageType = 'error';
      this.message = 'Error scheduling class. Check console for details.';
    } finally {
      this.isProcessing = false;
    }
  }

  async toggleCancel(cls: YogaClass) {
    this.isProcessing = true;
    this.message = null;

    try {
      // FIX: Using the correct 'classes' document path
      const docRef = doc(this.db, `classes`, cls.id);
      const newStatus = !cls.isCanceled;

      await updateDoc(docRef, {
        isCanceled: newStatus
      });

      this.messageType = 'success';
      this.message = `Class at ${cls.location} has been ${newStatus ? 'CANCELED' : 'RE-ACTIVATED'}.`;

    } catch (error) {
      console.error('Error toggling cancel status:', error);
      this.messageType = 'error';
      this.message = 'Error updating status. Check console for details.';
    } finally {
      this.isProcessing = false;
    }
  }

  async deleteClass(classId: string) {
    this.isProcessing = true;
    this.message = null;

    try {
      // FIX: Using the correct 'classes' document path
      const docRef = doc(this.db, `classes`, classId);

      await deleteDoc(docRef);

      this.messageType = 'success';
      this.message = `Class successfully deleted.`;
    } catch (error) {
      console.error('Error deleting class:', error);
      this.messageType = 'error';
      this.message = 'Error deleting class. Check console for details.';
    } finally {
      this.isProcessing = false;
    }
  }
}