import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'AiAgentClient';

  userQuery: string = '';
  AIResponse: string = '';
  isLoading = false;

  async sendQuery() {
      if(!this.userQuery.trim()) 
        return;

      this.isLoading = true;
      try{
          const result = await fetch('http://localhost:8987/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: this.userQuery })
          });

          const data = await result.json();
          //console.log(data.response);
          this.AIResponse = data.response.replace(/•/g, '<br>•');
      }catch(error){
          console.error('❌ Error: ', error);
          this.AIResponse = 'Error while communicating with AI.';
      }finally{
          this.isLoading = false;
      }
  }
}
