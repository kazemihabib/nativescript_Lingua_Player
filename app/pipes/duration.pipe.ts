import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'DurationPipe' })
export class DurationPipe implements PipeTransform {
    transform(value: string, args: string[]): any {
        if (!value) return value;

        let intValue = parseInt(value);

        let totalHours, totalMinutes, totalSeconds, hours, minutes, seconds, result = '';

        totalSeconds = intValue / 1000;
        totalMinutes = totalSeconds / 60;
        totalHours = totalMinutes / 60;

        seconds = Math.floor(totalSeconds) % 60;
        minutes = Math.floor(totalMinutes) % 60;
        hours = Math.floor(totalHours) % 60;

        if (hours !== 0) {
            result += hours + ':';

            if (minutes.toString().length == 1) {
                minutes = '0' + minutes;
            }
        }

        result += minutes + ':';

        if (seconds.toString().length == 1) {
            seconds = '0' + seconds;
        }

        result += seconds;

        return result;
    }
}