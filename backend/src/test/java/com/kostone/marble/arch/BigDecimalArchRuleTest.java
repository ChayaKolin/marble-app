package com.kostone.marble.arch;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

/**
 * Enforces that financial and dimensional calculation classes never use
 * float or double primitives — all such values must use BigDecimal.
 */
class BigDecimalArchRuleTest {

    private static final JavaClasses FINANCIAL_CLASSES = new ClassFileImporter()
            .importPackages("com.kostone.marble.domain.financial",
                            "com.kostone.marble.domain.order",
                            "com.kostone.marble.service.financial",
                            "com.kostone.marble.service.order");

    @Test
    void financial_classes_must_not_declare_float_fields() {
        ArchRule rule = noFields()
                .that().areDeclaredInClassesThat().resideInAnyPackage(
                        "com.kostone.marble.domain.financial..",
                        "com.kostone.marble.domain.order..",
                        "com.kostone.marble.service.financial..",
                        "com.kostone.marble.service.order..")
                .should().haveRawType(float.class)
                .orShould().haveRawType(Float.class)
                .orShould().haveRawType(double.class)
                .orShould().haveRawType(Double.class)
                .because("All financial and dimensional values must use BigDecimal to prevent rounding errors");

        rule.check(FINANCIAL_CLASSES);
    }

    @Test
    void financial_methods_must_not_return_float_or_double() {
        ArchRule rule = noMethods()
                .that().areDeclaredInClassesThat().resideInAnyPackage(
                        "com.kostone.marble.domain.financial..",
                        "com.kostone.marble.service.financial..")
                .should().haveRawReturnType(float.class)
                .orShould().haveRawReturnType(Float.class)
                .orShould().haveRawReturnType(double.class)
                .orShould().haveRawReturnType(Double.class)
                .because("Financial service methods must return BigDecimal, not floating-point types");

        rule.check(FINANCIAL_CLASSES);
    }
}
