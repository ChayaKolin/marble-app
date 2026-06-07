package com.kostone.marble.service.measurer;

import com.kostone.marble.domain.measurer.Measurer;
import com.kostone.marble.domain.measurer.MeasurerRepository;
import com.kostone.marble.dto.measurer.CreateMeasurerRequest;
import com.kostone.marble.dto.measurer.MeasurerResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MeasurerService {

    private final MeasurerRepository measurerRepository;

    @Transactional
    public MeasurerResponse create(CreateMeasurerRequest req) {
        Measurer measurer = new Measurer();
        measurer.setFirstName(req.firstName());
        measurer.setLastName(req.lastName());
        measurer.setPhoneNumber(req.phoneNumber());
        return MeasurerResponse.from(measurerRepository.save(measurer));
    }

    @Transactional(readOnly = true)
    public List<MeasurerResponse> listActive() {
        return measurerRepository.findAllByDeletedAtIsNullOrderByFirstNameAscLastNameAsc()
                .stream().map(MeasurerResponse::from).toList();
    }
}
