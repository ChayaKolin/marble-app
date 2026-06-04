package com.kostone.marble.service.customer;

import com.kostone.marble.domain.customer.Customer;
import com.kostone.marble.domain.customer.CustomerRepository;
import com.kostone.marble.dto.customer.CreateCustomerRequest;
import com.kostone.marble.dto.customer.CustomerResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerResponse create(CreateCustomerRequest req) {
        Customer customer = new Customer();
        customer.setFullName(req.fullName());
        customer.setPhoneNumber(req.phoneNumber());
        customer.setEmailAddress(req.emailAddress());
        customer.setSiteAddress(req.siteAddress());
        customer.setSiteCity(req.siteCity());
        customer.setSiteFloor(req.siteFloor());
        customer.setSiteApt(req.siteApt());
        customer.setArchitectName(req.architectName());
        customer.setArchitectPhone(req.architectPhone());
        return CustomerResponse.from(customerRepository.save(customer));
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> listActive() {
        return customerRepository.findAllByDeletedAtIsNull()
                .stream().map(CustomerResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> listDeleted() {
        return customerRepository.findAll().stream()
                .filter(Customer::isDeleted)
                .map(CustomerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse getById(UUID id) {
        return customerRepository.findByIdAndDeletedAtIsNull(id)
                .map(CustomerResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    /** Soft delete — sets deleted_at; never issues SQL DELETE. */
    @Transactional
    public void softDelete(UUID id) {
        Customer customer = customerRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        customer.setDeletedAt(OffsetDateTime.now());
        customerRepository.save(customer);
    }

    /** Restore — clears deleted_at. */
    @Transactional
    public CustomerResponse restore(UUID id) {
        Customer customer = customerRepository.findById(id)
                .filter(Customer::isDeleted)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deleted customer not found"));
        customer.setDeletedAt(null);
        return CustomerResponse.from(customerRepository.save(customer));
    }
}
