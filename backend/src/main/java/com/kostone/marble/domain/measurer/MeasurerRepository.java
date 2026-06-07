package com.kostone.marble.domain.measurer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MeasurerRepository extends JpaRepository<Measurer, UUID> {

    List<Measurer> findAllByDeletedAtIsNullOrderByFirstNameAscLastNameAsc();

    Optional<Measurer> findByIdAndDeletedAtIsNull(UUID id);
}
