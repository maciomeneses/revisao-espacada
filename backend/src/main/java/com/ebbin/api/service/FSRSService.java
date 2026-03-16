package com.ebbin.api.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;

@Service
public class FSRSService {

    // Default FSRS v6 parameters (21 weights)
    private static final double[] DEFAULT_W = {
        0.4025, 0.8935, 2.1812, 4.1256, // S0 (stability for G1-G4)
        4.8228, 0.7428, 0.9651, 0.0215, // D0, Stability update constants
        1.4505, 0.1490, 1.0151, // more stability update
        2.0, 0.06, 0.32, 1.3, // more stability update
        0.42, 2.26, // more difficulty update
        0.0, 0.5, 0.0, 0.2 // more parameters for v6
    };

    private static final double REQUEST_RETENTION = 0.9;
    private static final double DECAY = -0.5;
    private static final double FACTOR = Math.pow(0.9, 1.0 / DECAY) - 1;

    public static class FSRSState {
        public double stability;
        public double difficulty;
        public int elapsedDays;
        public int scheduledDays;
        public int reps;
        public int lapses;
        public String state;
        public LocalDate nextReviewDate;
    }

    public FSRSState init(int rating) {
        FSRSState s = new FSRSState();
        s.reps = 1;
        s.lapses = 0;
        s.state = "Learning";
        s.stability = DEFAULT_W[rating - 1];
        s.difficulty = DEFAULT_W[4] - (rating - 1) * DEFAULT_W[5];
        s.difficulty = Math.max(1, Math.min(10, s.difficulty));
        s.scheduledDays = (int) Math.round(s.stability * FACTOR);
        s.scheduledDays = Math.max(1, s.scheduledDays);
        s.nextReviewDate = LocalDate.now().plusDays(s.scheduledDays);
        return s;
    }

    public FSRSState update(FSRSState current, int rating, LocalDateTime now) {
        FSRSState next = new FSRSState();
        next.reps = current.reps + 1;
        next.lapses = current.lapses + (rating == 1 ? 1 : 0);
        next.state = (rating == 1) ? "Relearning" : "Review";
        
        long daysSinceLast = ChronoUnit.DAYS.between(current.nextReviewDate.minusDays(current.scheduledDays), now.toLocalDate());
        next.elapsedDays = (int) Math.max(0, daysSinceLast);
        
        double retrievability = Math.pow(1 + FACTOR * next.elapsedDays / current.stability, DECAY);

        // Update Difficulty
        double deltaD = -DEFAULT_W[17] * (rating - 3); // Placeholder for FSRS v6 D update
        next.difficulty = current.difficulty + deltaD;
        next.difficulty = Math.max(1, Math.min(10, next.difficulty));

        // Update Stability
        if (rating == 1) {
            next.stability = DEFAULT_W[11] * Math.pow(current.difficulty, -DEFAULT_W[12]) * 
                             (Math.pow(current.stability + 1, DEFAULT_W[13]) - 1) * 
                             Math.exp(DEFAULT_W[14] * (1 - retrievability));
        } else {
            double hardPenalty = (rating == 2) ? DEFAULT_W[15] : 1.0;
            double easyBonus = (rating == 4) ? DEFAULT_W[16] : 1.0;
            
            next.stability = current.stability * (1 + Math.exp(DEFAULT_W[8]) * 
                             (11 - next.difficulty) * Math.pow(current.stability, -DEFAULT_W[9]) * 
                             (Math.exp((1 - retrievability) * DEFAULT_W[10]) - 1) * hardPenalty * easyBonus);
        }

        next.scheduledDays = (int) Math.round(next.stability * FACTOR);
        next.scheduledDays = Math.max(1, next.scheduledDays);
        next.nextReviewDate = LocalDate.now().plusDays(next.scheduledDays);
        
        return next;
    }
}
