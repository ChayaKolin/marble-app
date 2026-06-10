package com.kostone.marble.service.activity;

import com.kostone.marble.domain.activity.ActivityAction;
import com.kostone.marble.domain.activity.ActivityEntityType;
import com.kostone.marble.domain.activity.ActivityLog;
import com.kostone.marble.domain.activity.ActivityLogRepository;
import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.dto.activity.ActivityLogResponse;
import com.kostone.marble.security.MarbleUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Records and lists significant order-lifecycle events for the Consultant's history view. */
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void record(ActivityEntityType entityType, UUID entityId, ActivityAction action,
                        String customerName, String description, String reason) {
        User performer = resolveCurrentUser();

        ActivityLog log = new ActivityLog();
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setAction(action);
        log.setPerformedByUserId(performer != null ? performer.getId() : null);
        log.setPerformedByName(performer != null ? performer.getFullName() : "מערכת");
        log.setCustomerName(customerName);
        log.setDescription(description);
        log.setReason(reason);
        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> listRecent() {
        return activityLogRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .map(ActivityLogResponse::from)
                .toList();
    }

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof MarbleUserDetails principal)) {
            return null;
        }
        return userRepository.findById(principal.getUserId()).orElse(null);
    }
}
