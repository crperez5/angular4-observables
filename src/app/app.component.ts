import { Component, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from "rxjs";
import "rxjs/add/observable/merge"; 
import "rxjs/add/observable/fromEvent"; 
import "rxjs/add/operator/mapTo";
import "rxjs/add/operator/map";
import "rxjs/add/observable/interval";
import "rxjs/add/operator/withLatestFrom";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('refresh') refreshButton;
  @ViewChild('close1') closeButton1;
  @ViewChild('close2') closeButton2;
  @ViewChild('close3') closeButton3;
  
  refreshClickStream;
  close1Clicks;
  close2Clicks;
  close3Clicks;
  startupRequestStream;
  requestOnRefreshStream;
  requestStream;
  responseStream;
  suggestion1Stream;
  suggestion2Stream;
  suggestion3Stream;
  
  constructor(private http: Http) {}

  ngAfterViewInit() {
    
    this.refreshClickStream = Observable.fromEvent(this.refreshButton.nativeElement, 'click');
    this.close1Clicks = Observable.fromEvent(this.closeButton1.nativeElement, 'click');
    this.close2Clicks = Observable.fromEvent(this.closeButton2.nativeElement, 'click');
    this.close3Clicks = Observable.fromEvent(this.closeButton3.nativeElement, 'click');
    this.startupRequestStream = Observable.of('https://api.github.com/users');
    
    // composition streams
    this.requestOnRefreshStream = this.refreshClickStream
      .map(ev => {
        var randomOffset = Math.floor(Math.random()*500);
        return 'https://api.github.com/users?since=' + randomOffset;
      });
    this.requestStream = this.startupRequestStream.merge(this.requestOnRefreshStream);
    this.responseStream = this.requestStream
      .flatMap(requestUrl =>
        this.http.get(requestUrl)
      )
      .map(r => r.json())
      .publishReplay().refCount(1);
      
    this.suggestion1Stream = this.createSuggestionStream(this.responseStream, this.close1Clicks);
    this.suggestion2Stream = this.createSuggestionStream(this.responseStream, this.close2Clicks);
    this.suggestion3Stream = this.createSuggestionStream(this.responseStream, this.close3Clicks);
      
    this.suggestion1Stream.subscribe(user => {
      this.renderSuggestion(user, '.suggestion1');
    });

    this.suggestion2Stream.subscribe(user => {
      this.renderSuggestion(user, '.suggestion2');
    });

    this.suggestion3Stream.subscribe(user => {
      this.renderSuggestion(user, '.suggestion3');
    });    
  }
  
  getRandomUser(listUsers) {
    return listUsers[Math.floor(Math.random()*listUsers.length)];
  }

  createSuggestionStream(responseStream, closeClickStream) {
    return responseStream.map(this.getRandomUser)
      .startWith(null)
      .merge(this.refreshClickStream.map(ev => null))
      .merge(
        closeClickStream.withLatestFrom(responseStream, 
                                    (x, R) => this.getRandomUser(R))
      );
  }



// Rendering ---------------------------------------------------
renderSuggestion(suggestedUser, selector) {
  var suggestionEl = document.querySelector(selector);
  if (suggestedUser === null) {
    suggestionEl.style.visibility = 'hidden';
  } else {
    suggestionEl.style.visibility = 'visible';
    var usernameEl = suggestionEl.querySelector('.username');
    usernameEl.href = suggestedUser.html_url;
    usernameEl.textContent = suggestedUser.login;
    var imgEl = suggestionEl.querySelector('img');
    imgEl.src = "";
    imgEl.src = suggestedUser.avatar_url;
  }
}



  

  
}
